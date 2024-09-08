#Sales logic.py
import pandas as pd
from src.Insight_logic.trigger_global_configs import Global_Checks
import itertools
from src.Utils.load_funcs import load_meta_data
from src.graph_utils.Graph_funcs import find_edge_attributes_with_indirect_connections
from src.query_data.get_data import fetch_required_data_and_apply_filters
from src.query_data.query_exceptions import separate_exception_entities
from src.query_data.get_data_helper import filter_values_handler
meta_data  = load_meta_data()

####################ASSUMPTION: Period is same for all region and partner combination
def get_suggestions(resdf, graph, metric, user_input, list_of_nodes, metric_list, dimension_values, dimension_data, dimension_list, list_of_columns_to_be_present_for_trigger_check, list_of_column_checks, filters = {} ):
    responses = []
    
    ##1. Retrieve data from resdf or graph 
    ## 1.1 Check if all columns present in resdf
    cols_present_in_resdf = {val['GMD Name'] : key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in list_of_columns_to_be_present_for_trigger_check and key in resdf)}
    ## 1.2 remaining columns need to be retrieved
    cols_not_present_in_resdf = list(set(list_of_columns_to_be_present_for_trigger_check) - set(cols_present_in_resdf.keys()))
    
    ## 1.3 if some columns needed for trigger check not present in resdf, retrieve data from graph
    if cols_not_present_in_resdf:
        
        #check if these cols are in meta data i.e. implying their availability in graph, as metadata stores only columns present in graph
        nodes = [key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in cols_not_present_in_resdf)]

        # if any required columns are not present in graph, return no suggestions as trigger check cannot be performed, TODO: Theta checking
        if len(nodes) < len(cols_not_present_in_resdf):
            still_not_present = cols_not_present_in_resdf - set(nodes)
            op = ', '.join(still_not_present)
            return {0:{'Suggestion': f'Please provide {op} columns data in your files to get more valuable insights related to Sales', 'Filter Variables': None}}
        
        # Retrieve files such that all required columns are present
        list_of_paths = find_edge_attributes_with_indirect_connections(graph, nodes+list_of_nodes)

        # if there is no possible files that when merged together have all required columns, return no suggestions TODO: Theta checking
        if not list_of_paths:
            return {0:{'Suggestion': f'Please link Region or Partner type columns with Sales in your files to get more valuable insights related to Sales', 'Filter Variables': None}}
        
        # if there are possible files that when merged together have all required columns, fetch required data and apply filters similar to specified in user query 
        _, temp_df, _, _, _ = fetch_required_data_and_apply_filters(list_of_paths, user_input, metric_list, dimension_values, dimension_list)
        
        if dimension_data:
            exclusions, inclusions = separate_exception_entities(user_input, dimension_values)
            df = filter_values_handler(dimension_data, inclusions, exclusions, df)
            df = df.reset_index(drop=True)

    else:
        # if all columns present in resdf, use resdf itself as it has already required columns
        temp_df = resdf.copy()

    ## Not used for primary suggestions, but instead used when user clicks on a suggestion and we need to dchek respective different columns for threshold 
    ## It is used for trigger column checks only, when a user clicks on a suggestion, we get filters for each column in that suggestion
    ## for example: bestbuy sales in west region, filters = {'Region': 'west', 'Partner Name': 'Bestbuy'} if we find a pattern in sales in west region for bestbuy and user is interested in that
    ## This will help us ensure checking for related trigger metric/dimension checks in those speciifc filters that user is interested in 
    ## Example trigger columns: WOS, Traffic for Sales based on whether sales goes up or down
    if filters:
        mask = pd.Series(True, index=temp_df.index)
        for col, value in filters.items():
            mask &= temp_df[col] == value
        temp_df = temp_df[mask]
    
    # 2. Apply threshold

    temp_df = temp_df.reset_index()
    
    # 2.1 Get column names from given metric name from gmd, NOTE: metric name is GMD name always here
    metric_col = {key:val['GMD Name'] for key, val in meta_data['metric'].items() if val['GMD Name'] == metric and key in resdf}
    # print(metric_col )
    
    # 2.2 Get column names from GMD names from list of columns that need to be checked for given metric
    cols = {val['GMD Name'] : key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in list_of_column_checks and key in temp_df)}
    cols = [cols[val] for val in list_of_column_checks if val in cols]
    
    # TODO- check if Date is monthly or on what granularity and convert to monthly or yearly based on threhold granularity
    col2 = {val['GMD Name'] : key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in list_of_columns_to_be_present_for_trigger_check and key in temp_df)}
    col2 = [col2[val] for val in list_of_columns_to_be_present_for_trigger_check if val in col2]
    # Currently just to accomodate if we have more than one metric cols in resdf, which is generated from user query i.e. when user is querying for sales for laptop and mobile at same time
    for met, gmd_name in metric_col.items():
        temp_df2 = temp_df[list(col2)+[met]]
        temp_df2 = temp_df2.groupby(col2).sum().reset_index()

        
        # 2.3 Take all possible combinations of the columns that need to be checked for given metric from 
        for combination in itertools.product(*(temp_df2[col].unique() for col in cols)):
            
            threshold = Global_Checks[gmd_name]['thresholds']
            
            #dig for threshold
            try:
                for filter_var in combination:
                
                    threshold = threshold[filter_var.lower()]
            except KeyError:
                print(f'No threshold found for {combination}')
                continue    

            #Mask to get data that satisfies given combination
            mask = pd.Series(True, index=temp_df2.index)
            
            for col, value in zip(cols, combination):
                mask &= temp_df2[col] == value
                        
            ## IF threshold doesn't exist for given partner and region, then continue
            # print(cols,combination)
            postive_thre_reaching_vals = temp_df2[(temp_df2[met] >= threshold[0]) & mask]
            negative_thre_reaching_vals = temp_df2[(temp_df2[met] <= threshold[1]) & mask]
            
            filtered_df = temp_df2.copy()
            for column, unique_value in zip(cols, combination):
                filtered_df = filtered_df[filtered_df[column] == unique_value]
            filtered_df = filtered_df.reset_index(drop = True)
            # print(filtered_df )
            # Hard code date column name should be changed 
            chart = {":".join(list(combination)):{}}
            chart[":".join(list(combination))]["data"] = filtered_df[["Date",list(metric_col.keys())[0]]].groupby("Date").sum().reset_index().set_index("Date")[list(metric_col.keys())[0]].to_dict()
            
            sug = f'Found {met} pattern among {", ".join(combination[:-1])+ f" and {combination[-1]}"}, please click here to get more info'
            filter_variables = {k:[v] for k,v in zip(cols, combination)}

            if not postive_thre_reaching_vals.empty and not negative_thre_reaching_vals.empty:
                pass
            elif not postive_thre_reaching_vals.empty:
                responses.append({'Suggestion': sug, 'Filters Info': {'Trend':'Up', 'Metric': met, 'Filter_Variables' :filter_variables, 'Associated df':postive_thre_reaching_vals.to_dict()}})
            elif not negative_thre_reaching_vals.empty:
                responses.append({'Suggestion': sug, 'Filters Info': {'Trend':'Down', 'Metric': met, 'Filter_Variables' :filter_variables, 'Associated df':negative_thre_reaching_vals.to_dict()}})

    
    return {index: value for index, value in enumerate(responses)}