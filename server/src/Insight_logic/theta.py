import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import itertools
from src.Utils.load_funcs import load_meta_data, load_graph
from src.graph_utils.Graph_funcs import find_edge_attributes_with_indirect_connections
from src.query_data.get_data import fetch_required_data_and_apply_filters

meta_data = load_meta_data()
graph = load_graph()

list_of_columns_to_be_present_for_trigger_check = ['Partner', 'Location 2', 'Date']
list_of_column_checks = ['Partner', 'Location 2']
theta_thresholds = {
    'Monthly': [60,30, 10],
    'Weekly': [60,30, 10],
    'Daily': [60,30, 10]
    
}


def min_max_scale(df_list_of_values):
    return (df_list_of_values - np.min(df_list_of_values)) / (np.max(df_list_of_values) - np.min(df_list_of_values))

def angle_check(theta, theta_thresholds):
    if theta>=theta_thresholds[0]:
        return 0    ##Large shift
    if theta < theta_thresholds[0] and theta >=theta_thresholds[1]:
        return 1    ##  possibility of medium shift if this continues for 3 continous points
    if theta < theta_thresholds[1] and theta >= theta_thresholds[2]:
        return 2    ## possibility of small shift if this continues for 6 continous points
    return None

def pattern_recognition_theta(thetas, ranges, freq):

    large_shift = []
    medium_shift = []
    small_shift = []
    
    # fill_angle_shifts = [large_shift, medium_shift_temp, small_shift_temp]
    #while True
    for index in range(len(thetas)):
        theta = thetas[index]
        ran = ranges[index]
        angle_check_value = angle_check(theta, theta_thresholds[freq])

        if not angle_check_value:
            continue
        if angle_check_value == 0:
            large_shift.append(ran)

        if angle_check_value == 1:
            if not (index+2 < len(thetas)):
                continue
            avg_theta_3_above = (thetas[index+2] + thetas[index+1] + thetas[index])/3

            if angle_check(avg_theta_3_above, theta_thresholds[freq]) == 1:
                medium_shift.append([ran[0], ranges[index+2][1]])
        
            
        if angle_check_value == 2:
            if not (index+5 < len(thetas)):
                continue
            avg_theta_6_above = (thetas[index+5] + thetas[index+4] + thetas[index+3] + thetas[index+2] + thetas[index+1] + thetas[index])/6
            if angle_check(avg_theta_6_above, theta_thresholds[freq]) == 2:
                small_shift.append([ran[0], ranges[index+5][1]])

    return large_shift, medium_shift, small_shift

        
def do_theta_threshold_checks(metric, list_of_columns_to_be_present_for_trigger_check, list_of_column_checks, resdf, list_of_nodes, user_input, metric_list, dimension_values, dimension_list):

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
            k = ', '.join(still_not_present)
            return [{'Suggestion': f'Please provide {k} columns data in your files to get more valuable insights related to Sales', 'Filter Variables': None}]
        
        # Retrieve files such that all required columns are present
        list_of_paths = find_edge_attributes_with_indirect_connections(graph, nodes+list_of_nodes)

        # if there is no possible files that when merged together have all required columns, return no suggestions TODO: Theta checking
        if not list_of_paths:
            return [{'Suggestion': f'Please link Region or Partner type columns with Sales in your files to get more valuable insights related to Sales', 'Filter Variables': None}]
        
        # if there are possible files that when merged together have all required columns, fetch required data and apply filters similar to specified in user query 
        temp_df, _, _, _ = fetch_required_data_and_apply_filters(list_of_paths, user_input, metric_list, dimension_values, dimension_list)

    else:
        # if all columns present in resdf, use resdf itself as it has already required columns
        temp_df = resdf.copy()

    # 2.1 Get column names from given metric name from gmd, NOTE: metric name is GMD name always here
    metric_col = {key:val['GMD Name'] for key, val in meta_data['metric'].items() if val['GMD Name'] == metric and key in resdf}

    # 2.2 Get column names from GMD names from list of columns that need to be checked for given metric
    cols = {val['GMD Name'] : key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in list_of_columns_to_be_present_for_trigger_check and key in temp_df)}
    date_col = [val['GMD Name'] for val in meta_data['dimensions'].values() if val['GMD Name'] == 'Date'][0]
    cols = [cols[val] for val in list_of_columns_to_be_present_for_trigger_check if val in cols]
    cols2 = {val['GMD Name'] : key for key, val in meta_data['dimensions'].items() if (val['GMD Name'] in list_of_column_checks and key in temp_df)}
    cols2 = [cols2[val] for val in list_of_column_checks if val in cols2]
    combo = {}
    # Currently just to accomodate if we have more than one metric cols in resdf, which is generated from user query i.e. when user is querying for sales for laptop and mobile at same time
    for met, gmd_name in metric_col.items():
        temp_df2 = temp_df[list(cols)+[met]]
        temp_df2 = temp_df2.groupby(cols).sum().reset_index()
        # 2.3 Take all possible combinations of the columns that need to be checked for given metric from 
        for combination in itertools.product(*(temp_df2[col].unique() for col in cols2)):

            #Mask to get data that satisfies given combination
            mask = pd.Series(True, index=temp_df2.index)
            
            for col, value in zip(cols2, combination):
                mask &= temp_df2[col] == value
                        
            # df where mask is true, i.e. for particular filter of values from list_of_
            sub_df = temp_df2[mask]
            
            # #plot sub_df

            # Convert date column to datetime
            dates = pd.to_datetime(sub_df[date_col], format='%Y-%m-%d', errors='coerce')

            # Sort the dates
            dates = dates.sort_values().reset_index(drop=True)

            # Calculate the difference between consecutive dates
            date_diffs = dates.diff().dropna()

            # Analyze the frequency
            if date_diffs.dt.days.mode()[0] == 1:
                frequency = 'Daily'
                x_time = dates.dt.day

            elif date_diffs.dt.days.mode()[0] == 7:
                frequency = 'Weekly'
                x_time = dates.dt.isocalendar().week

            elif date_diffs.dt.days.mode()[0] in range(28, 32):
                frequency = 'Monthly'
                x_time = dates.dt.month

            elif date_diffs.dt.days.mode()[0] in range(365, 367):
                frequency = 'Yearly'
                x_time = dates.dt.year
            else:
                continue

            #Check if all diff in x_time are 1:
            if not np.all(np.diff(x_time) == 1):
                ###CASE when a month is mssing from data of dates
                pass
                
            ranges = [[dates[i], dates[i+1]] for i in range(len(dates)-1)]
            
            ##Scale min max
            x_time = min_max_scale(x_time)

            ##Scale min max
            y_metric = min_max_scale(sub_df[met])


            dx = np.diff(x_time)
            dy = np.diff(y_metric)
            
            # Calculate the angles in radians, then convert to degrees
            thetas = np.degrees(np.arctan2(dy, dx))
            large_shift, medium_shift, small_shift = pattern_recognition_theta(thetas, ranges, frequency)

            # print(small_shift)
            combo[sug] = {}
            combo[sug]["combination"] = combination
            combo[sug]["shift"] = {}

            if large_shift:
                combo[sug]["shift"]["type"] = "Large"
                combo[sug]["shift"]["duration"] = large_shift
                
            elif medium_shift:
                combo[sug]["shift"]["type"] = "Medium"
                combo[sug]["shift"]["duration"] = medium_shift
                
            elif small_shift:
                combo[sug]["shift"]["type"] = "Small"
                combo[sug]["shift"]["duration"] = small_shift
                
            sug += 1
    return combo