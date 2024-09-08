import pandas as pd
#Words that will be removed from query string before processing
WORDS_TO_REMOVE = ["as", "he", "her"]

GLOBAL_LOCATIONS_SIGNIFIERS  = ['Location 1', 'Location 2']

GMD_DICT_PATH = r'gmd_utils'
UPLOAD_FOLDER = r'User_data/Uploads'
GRAPH_FOLDER = r'User_data/graphs'
DATA_FOLDER = r'User_data/file_datas'
META_DATA_FOLDER = r'User_data/meta_datas'



##REGEXES
EXCEPTION_REGEXES = r'(?:except|not|excluding)\s*(.*?)\s+(?:and|or)\s+(\w+)|(except|exluding)\s*\w*'

COMPARISON_REGEXES = r'(\w*\s*\w+)(?:\s*data)?\s*(?:is|have|has|are)?\s+(greater than or equals? to|less than or equals? to|greater(?: than)?|less(?: than)?|equals?(?: to)?|>|<|=|)\s*(\d+)'

AGGREGATION_REGEXES = r'(\w*\s*\w+)?\s*(mean|ave?r?a?ge?|median|mode|sum|counts?|min|max)\s*(?:of|for)?\s+(\w+\s*\w*)'

TOP_BOTTOM_REGEX =  [ r'(top|bottom|first|last|largest|smallest|worst|best(?!\sbuy)|highest|lowest)\s+(\d+)|(\d+)\s+(top|bottom|first|last|largest|smallest|worst|best(?!\sbuy)|highest|lowest)',
                      r'\b(top|bottom|first|last|largest|smallest|worst|best(?!\sbuy)|highest|lowest|ascending order|descending order)\b'
                     ]
