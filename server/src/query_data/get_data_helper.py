import pandas as pd

def outer_join_all_columns(dfs):
    # Start with the first DataFrame
    result = dfs[0]
    
    # Iterate over the remaining DataFrames
    for df in dfs[1:]:
        # Find common columns between the current result and the next DataFrame
        common_columns = list(set(result.columns).intersection(set(df.columns)))
        
        # If there are common columns, merge on those
        if common_columns:
            result = pd.merge(result, df, on=common_columns, how='outer')
        else:
            # If no common columns, do a cartesian product to keep all data
            result = result.merge(df, left_index=True, right_index=True, how='outer')
    
    return result

def comparison_handler(comparisons, df):
    for comparison in comparisons:
        col_name = comparison[0]
        comparison_type = comparison[1]
        number = comparison[2]

        if comparison_type == ">=":
            df = df[df[col_name] >= number]
        elif comparison_type == "<=":
            df = df[df[col_name] <= number]
        elif comparison_type == ">":
            df = df[df[col_name] > number]
        elif comparison_type == "<":
            df = df[df[col_name] < number]
        elif comparison_type == "==":
            df = df[df[col_name] == number]
    return df

def filter_values_handler(dimension_data, inclusions, exclusions, df):
    for key in dimension_data.keys():
        col_name = key
        values = dimension_data[key]['Value']
        # df = df[df[col_name].isin(values)]
        if inclusions!=[]:
            includes = [val for val in values if val in inclusions]
            if includes:
                df = df[df[col_name].isin(includes)]

        if exclusions!=[]:
            excludes = [val for val in values if val in exclusions]
            df = df[~(df[col_name].isin(excludes))]
    return df



def query_info(df, aggregations, after_comp,dimension_data,dimension_list, metric_list):
    if metric_list:
        m_list = list(metric_list.keys())
    else:
        m_list = []

    if aggregations:
        agg = aggregations
    else:
        agg = {}
    
    if after_comp:
        comp = after_comp
    else:
        comp = {}
    
    if dimension_data:
        col_dict = df.nunique().to_dict()
        d_value = []
        d_list = list(set(dimension_list.keys()).union(set(dimension_data.keys())))
        for key in d_list:
            if key in list(dimension_data.keys()):
                if len(dimension_data[key]["Value"]) == col_dict[key]:
                    d_value.append(["All"])
                else:
                    d_value.append(dimension_data[key]["Value"])
            elif key in list(dimension_list.keys()):
                d_value.append(["All"])
    else:
        d_list = []
        d_value = []

    f_val = {"Metric Mentioned": m_list,
             "Specfic Dimension Value" : d_value,
             "Dimension List" : d_list,
             "Aggregation" : agg,
             "Comparison" : comp,
             "Time" : None
    }
    return f_val