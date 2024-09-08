import pandas as pd
from src.query_data.get_data_helper import filter_values_handler
from src.Utils.load_funcs import load_meta_data
# Sales x Traffic actions
def Sales_up_Traffic_up(**kwargs):
    return

def Sales_down_Traffic_down(**kwargs):
    return

def Sales_up_Traffic_down(**kwargs):
    return

def Sales_down_Traffic_up(**kwargs):
    return


# Sales x WOS actions
def Sales_up_WOS_up(**kwargs):
    return

def Sales_down_WOS_down(**kwargs):

    return

def Sales_up_WOS_down(**kwargs):
    if not 'df' in kwargs:
        return None
    
    df = kwargs['df']
    dimension_data = kwargs['dimension_data']
    exclusions = kwargs['exclusions']
    inclusions = kwargs['inclusions']

    meta_data = load_meta_data()
    flag = False
    location_cols = meta_data['Location Cols']
    for i in dimension_data.keys():
        if i in location_cols:
            flag = True
            #remove from inclusions
            for k in dimension_data[i]['Value']:
                if k in inclusions:
                    inclusions.remove(k)
                print(k)
        
                exclusions.append(k)
    if not flag:
        return None
    # print(inclusions, exclusions)
    df = filter_values_handler(dimension_data, inclusions, exclusions, df)
    df = df[df['WOS'] == df['WOS'].max()]


    return df

def Sales_down_WOS_up(**kwargs):
    return


ACTION_DICT = {
    'Sales':{
        'Up': {
                'WOS': {
                    'Up': Sales_up_WOS_up,
                    'Down': Sales_up_WOS_down
                },
                'Traffic': {
                    'Up': Sales_up_Traffic_up,
                    'Down': Sales_up_Traffic_down
                }
               },

        'Down': {
                'WOS': {
                    'Up': Sales_down_WOS_up,
                    'Down': Sales_down_WOS_down
                    },
                'Traffic': {
                    'Up': Sales_down_Traffic_up,
                    'Down': Sales_down_Traffic_down
                    }
                }
    }
}