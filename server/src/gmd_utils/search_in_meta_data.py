import re
from src.Utils.load_funcs import load_gmd, load_meta_data

def fetch_for_metric(query, meta_data=load_meta_data()):
    # meta_data = load_meta_data()
    metric_list = {}
    for key in meta_data['metric'].keys():
        pat = r'\b' + r'\b|\b'.join(sorted(meta_data['metric'][key]['regexes'])) + r'\b'
        
        if re.search(pat, query, re.IGNORECASE):
            # metric_list.append(key)
            metric_list[key] = meta_data['metric'][key]['regexes']
    return metric_list


def fetch_for_dimension_name(query, meta_data=load_meta_data()):
    # meta_data = load_meta_data()
    dimension_list = {}
    for key in meta_data['dimensions'].keys():
        regexes = meta_data['dimensions'][key]['regexes']
        for regex in regexes:
            if (regex != '') and (regex is not None):
                if re.search(fr'\b{regex}\b', query, re.IGNORECASE):
                    # dimension_list.append(key)
                    dimension_list[key] = [regex]
                    break

    return dimension_list


def fetch_for_specific_dimension(query, meta_data=load_meta_data()):
    # meta_data = load_meta_data()
    dimension_list = {}
    dimension_vals = []
    for key in meta_data['dimensions'].keys():
        regexes = meta_data['dimensions'][key]['Unique Values']
        for regex in regexes:
            if regex != '' and regex is not None:
                if re.search(fr'\b{regex}\b', query, re.IGNORECASE):
                    if key not in dimension_list:
                        dimension_list[key] = {'Value': [regex]}
                        dimension_vals.append(regex)
                    else:
                        dimension_list[key]['Value'] += [regex]
                        dimension_vals.append(regex)
    return dimension_list, dimension_vals