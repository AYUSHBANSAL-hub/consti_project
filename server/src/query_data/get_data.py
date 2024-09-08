
import os
import polars as pl
import polars.selectors as cs
from flask import Response, jsonify
from src.gmd_utils.search_in_meta_data import fetch_for_metric, fetch_for_specific_dimension, fetch_for_dimension_name
from src.Utils.load_funcs import load_meta_data, load_graph
from src.Utils.Config import DATA_FOLDER
from src.graph_utils.Graph_funcs import find_edge_attributes_with_indirect_connections
from src.query_data.query_exceptions import separate_exception_entities
from src.query_data.filters_and_aggregation_search import extract_comparisons, extract_aggregations, extract_top_or_bottom_n
from src.query_data.get_data_helper import filter_values_handler, comparison_handler, outer_join_all_columns

import networkx as nx
import pandas as pd

def fetch_required_data_and_apply_filters(list_of_paths, user_input, metric_list, dimension_values, dimension_list):
    dfs = [pd.read_csv(os.path.join(os.path.dirname(__file__),'..', DATA_FOLDER, file_name)) for file_name in list_of_paths]

    #Outerjoin on common columns
    df = outer_join_all_columns(dfs)
    # Keeping record of initial dataframe 
    i_df = df.copy()
    exclusions, inclusions = separate_exception_entities(user_input, dimension_values)

    col_w_regex = {key: metric_list.get(key, []) + dimension_list.get(key, []) for key in metric_list.keys() | dimension_list.keys()}

    aggregations = extract_aggregations(user_input, col_w_regex)
    comparisons = extract_comparisons(user_input, col_w_regex)

    list_to_groupby = []

    #Value filter according to dimension values
    
    if dimension_list:
        list_to_groupby+= dimension_list

    #Comparison filter
    after_comp =[]
    before_comp = []

    if aggregations:
        #Assumption: if an entity say sales is asked in query then it is only asked like  sales >/</= 5000 or avg/agg sales </>/= 5000
        # not like avg sales where sales are greater than 5000 
        for comp in comparisons:
            if comp[0] in aggregations:
                after_comp.append(comp)
            else:
                before_comp.append(comp)
        
    else:
        before_comp = comparisons

    if before_comp:
        df = comparison_handler(before_comp, df)

    
    return i_df, df.reset_index(drop=True), after_comp, aggregations, list_to_groupby

def fetch_data(user_input):
    ###To Do Access Control with email ID
    """Function to find results"""
    graph = load_graph()
    if not graph:
        return jsonify({"message": "No graph found, can't fetch data"})
    
    meta_data_dict = load_meta_data()

    #Fetch List of metric names
    metric_list = fetch_for_metric(user_input, meta_data_dict)

    #fetches specific dimension values like Partner name etc. if mentioned in query
    dimension_data, dimension_values = fetch_for_specific_dimension(user_input, meta_data_dict)

    #fetches for dimension names
    dimension_list = fetch_for_dimension_name(user_input, meta_data_dict)
    
    list_of_nodes = list(set(list(metric_list.keys()) + list(dimension_list.keys()) + list(dimension_data.keys())))

    list_of_paths = find_edge_attributes_with_indirect_connections(graph, list_of_nodes)

    i_df,df, after_comp, aggregations, list_to_groupby = fetch_required_data_and_apply_filters(list_of_paths, user_input, metric_list, dimension_values, dimension_list)
    
    if dimension_data:
        exclusions, inclusions = separate_exception_entities(user_input, dimension_values)
        df = filter_values_handler(dimension_data, inclusions, exclusions, df)
        df = df.reset_index(drop=True)
        list_to_groupby += list(dimension_data.keys())

    resdf = df.copy()

    df = df[list_of_nodes]

    #Grouping, comparisons and aggregation
    if list_to_groupby:
        list_to_groupby = list(set(list_to_groupby))
        #check if any column is numeric and not date, object or string
        numeric_columns = df.select_dtypes(include=[int, float]) \
                        .columns.difference(df.select_dtypes(include=['datetime', 'object', 'string']).columns)
        
        if not numeric_columns.empty:
            #if user defines an aggregation, use it
            if aggregations:
                #Assumption: if an entity say sales is asked in query then it is only asked like  sales >/</= 5000 or avg/agg sales </>/= 5000
                # not like avg sales where sales are greater than 5000 
                
                for col in df.columns:
                    if col not in aggregations and col in numeric_columns:
                        aggregations[col] = 'sum'
                df = df.groupby(list_to_groupby).agg(aggregations).reset_index()

                if after_comp:
                    df = comparison_handler(after_comp, df)
                    
            else:
                #else use sum as default
                df = df.groupby(list_to_groupby).sum().reset_index()
                # df = df.groupby(list_to_groupby).agg(['sum']).reset_index()
        else:
            #if there are no numeric columns then take first from groupby
            print('No numeric present')
            print(df)
            df = df.groupby(list_to_groupby).first().reset_index()
    else:
        # df = df.sum().reset_index()
        numeric_columns = df.select_dtypes(include=[int, float]) \
                        .columns.difference(df.select_dtypes(include=['datetime', 'object', 'string']).columns)
        rem_cols = list(df.columns.difference(numeric_columns))
        

        if not numeric_columns.empty:
            #if user defines an aggregation, use it
            if aggregations:
                #Assumption: if an entity say sales is asked in query then it is only asked like  sales >/</= 5000 or avg/agg sales </>/= 5000
                # not like avg sales where sales are greater than 5000 
                
                for col in df.columns:
                    if col not in aggregations and col in numeric_columns:
                        aggregations[col] = 'sum'
                if rem_cols:
                    df = df.groupby(rem_cols).agg(aggregations).reset_index()
                else:
                    df = df.agg(aggregations).reset_index(drop=True)

                if after_comp:
                    df = comparison_handler(after_comp, df)
                    
            else:
                #else use sum as default
                if rem_cols:
                    df = df.groupby(rem_cols).sum().reset_index()
                else:
                    df = df.agg(['sum']).reset_index(drop=True)

    top_or_bottom_n = extract_top_or_bottom_n(user_input)


    df = df.sort_values(by = list(metric_list.keys())).reset_index(drop=True)

    if top_or_bottom_n:
        # if top_or_bottom_n[0]=='top':
        #     df = df.sort_values(by = list(metric_list.keys())).reset_index(drop=True)
        if top_or_bottom_n[0]=='bottom':
            # df = df.sort_values(by = list(metric_list.keys()), ascending=False).reset_index(drop=True)
            if metric_list:
                df = df.sort_values(by = list(metric_list.keys()), ascending=False).reset_index(drop=True)
            else:
                df = df.sort_values(by = list(df.columns), ascending=False).reset_index(drop=True)
        if top_or_bottom_n[1] is None:
            top_or_bottom_n[1] = len(df)
        df = df.head(top_or_bottom_n[1]).reset_index(drop=True)
    
    return i_df, df, resdf, aggregations, list_to_groupby, after_comp, list_of_nodes, metric_list, dimension_data,dimension_values,dimension_list
