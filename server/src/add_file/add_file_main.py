import pandas as pd
import re
import itertools

from src.add_file.add_file_config import COLS_TO_ASK_OR_CHECK_PRESENCE_WHILE_ADDING_FOR_A_METRIC
from src.Utils.Config import GLOBAL_LOCATIONS_SIGNIFIERS

def give_mappings(df, gmd_dict):
    # out= {}
    mapped = {}
    metrics = []
    flag = 0
    for col in df.columns:
        for metric, regexes in gmd_dict['metric'].items():
            # print(col, metric, regexes)
            if any([re.search(r"\b{}\b".format(regex), col, re.IGNORECASE) for regex in regexes]):
                # print(col, metric)
                mapped[col] = metric
                metrics.append(metric)
                flag = 1
                break
                
        if flag == 1:
            flag = 0
            continue

        for dimension, regexes in gmd_dict['dimensions'].items():
            if any([re.search(r"\b{}\b".format(regex), col, re.IGNORECASE) for regex in regexes]):
                mapped[col] = dimension
                break

        #ID Check
        if any([re.search(r"\b{}\b".format(regex), col, re.IGNORECASE) for regex in gmd_dict['ID']]):
            mapped[col] = 'ID'
    misc = []
    for metric in metrics:
        if metric in COLS_TO_ASK_OR_CHECK_PRESENCE_WHILE_ADDING_FOR_A_METRIC:
            if set(COLS_TO_ASK_OR_CHECK_PRESENCE_WHILE_ADDING_FOR_A_METRIC[metric]) - set(mapped.values()):
                misc+=list(set(COLS_TO_ASK_OR_CHECK_PRESENCE_WHILE_ADDING_FOR_A_METRIC[metric]) - set(mapped.values()))
    misc = list(set(misc))
    unmapped = [col for col in df.columns if col not in mapped.keys()]
    dataTypes = {}
    #string , number or date
    for col in df.columns:
        if df.dtypes[col] == 'object':
            if df[col].dtype == 'object':
                
                try:
                    df[col] = pd.to_datetime(df[col])
                    dataTypes[col] = 'date'
                except ValueError:
                    dataTypes[col] = 'string'

        elif df.dtypes[col] == 'int64' or dataTypes[col] == 'float64':
            dataTypes[col] = 'number'
        else:
            dataTypes[col] = 'string'
    return {'dataTypes': dataTypes, 'Mapped': mapped,'Unmapped': unmapped, 'Misc_needed': misc}

def add_mappings_to_graph_and_meta_data(mappings, df, file_name, gmd_dict, graph, meta_store, id_graph):
    #Add nodes for each metric if it doesn't exist else add the file name to the list of file names
    node_list = mappings['Mapped']
    id_cols = []
    flag = 0
    # gmd_names = node_list.values()

    for node in node_list:
        if node not in graph:
            if pd.api.types.is_numeric_dtype(df[node]):
                mval = [int(val) if val.dtype == 'int64' else float(val) for val in  [df[node].mean()]][0]
                unique_values = [mval]                    
            elif pd.api.types.is_datetime64_any_dtype(df[node]):
                min_date = df[node].min()
                max_date = df[node].max()
                unique_values = [min_date.strftime('%Y-%m-%d'), max_date.strftime('%Y-%m-%d')]
            else:
                unique_values = list(df[node].unique())
            
            graph.add_node(node, file_names=[file_name])
            id_graph.add_node(node, file_names=[file_name])
        else:
            if file_name not in graph.nodes[node]['file_names']:
                graph.nodes[node]['file_names'].append(file_name)
            if file_name not in id_graph.nodes[node]['file_names']:
                id_graph.nodes[node]['file_names'].append(file_name)

        if not node in meta_store['metric'] and node_list[node] in gmd_dict['metric']:
            meta_store['metric'][node] = {'regexes': list(set(gmd_dict['metric'][node_list[node]] + [node.lower()])),'Unique Values': unique_values, 'GMD Name': node_list[node]}
        elif node_list[node] in gmd_dict['metric']:
            meta_store['metric'][node]['Unique Values'] += unique_values
            meta_store['metric'][node]['regexes'] = list(set(meta_store['metric'][node]['regexes'] + [node.lower()]))
            
        elif not node in meta_store['dimensions'] and node_list[node] in gmd_dict['dimensions']:
            meta_store['dimensions'][node] = {'regexes': list(set(gmd_dict['dimensions'][node_list[node]] + [node.lower()])),'Unique Values': unique_values, 'GMD Name': node_list[node]}
        elif node_list[node] in gmd_dict['dimensions']:
            meta_store['dimensions'][node]['Unique Values'] = list(set(meta_store['dimensions'][node]['Unique Values'] + unique_values))
            meta_store['dimensions'][node]['regexes'] = list(set(meta_store['dimensions'][node]['regexes'] + [node.lower()]))
        
        if node_list[node] in GLOBAL_LOCATIONS_SIGNIFIERS:
            if node not in meta_store['Location Cols']:
                meta_store['Location Cols'][node] = {'GMD Name': node_list[node]}
        if node_list[node] == 'ID':
            id_cols.append(node)
    
    for node1, node2 in itertools.combinations(node_list.keys(), 2):
            print(node1, node2)
            if not node1 == node2:
                if not graph.has_edge(node1, node2):
                    graph.add_edge(node1, node2, file_names=[file_name])
                    print('Added edge between {} and {}'.format(node1, node2))
                else:
                    print(graph.get_edge_data(node1, node2))
                    if file_name not in graph.edges[node1, node2]['file_names']:
                        # graph.edges[node1, node2]['file_names'][file_name] = col
                        graph.edges[node1, node2]['file_names'].append(file_name)
                    print('Updated edge between {} and {}'.format(node1, node2))
                if node1 in id_cols or node2 in id_cols:
                    if not id_graph.has_edge(node1, node2):
                        id_graph.add_edge(node1, node2, file_names=[file_name])
                        print('Added id grph edge between {} and {}'.format(node1, node2))
                    else:
                        print(id_graph.get_edge_data(node1, node2))
                        if file_name not in id_graph.edges[node1, node2]['file_names']:
                            # graph.edges[node1, node2]['file_names'][file_name] = col
                            id_graph.edges[node1, node2]['file_names'].append(file_name)
                        print('Updated id grph edge between {} and {}'.format(node1, node2))
    
    meta_store['Misc_info'][file_name]=mappings['Misc_needed']
    
    return graph, id_graph, meta_store