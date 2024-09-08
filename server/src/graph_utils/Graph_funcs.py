import networkx as nx
import pandas as pd
import re
import itertools
import polars as pl
from src.Utils.load_funcs import load_gmd, load_meta_data, load_graph
import os 
from src.Utils.Config import META_DATA_FOLDER, DATA_FOLDER, UPLOAD_FOLDER, GRAPH_FOLDER
import json
from flask import Response, jsonify


def add_file_to_graph_and_generate_meta_data(df, graph, meta_data_dict, gmd_dict, aliases, file_name) -> None:
    list_of_metrics = []

    for column_name in aliases:
        aliasuses = aliases[column_name]
        regexes = [r"\b{}\b".format(alias) for alias in aliasuses + [column_name]]
        flag = 0

        # check if column_name in gmd_dict['metric']
        for metric_name, metric_regexes in gmd_dict['metric'].items():
            if any(re.search(r"\b{}\b".format(regex), metric_name, re.IGNORECASE) for regex in regexes) : #Current: we are finding from aliases to gmd_dict, another or condition could be gmd_dict regexes -> column_name match
                
                #if numeric, take mean val
                if pd.api.types.is_numeric_dtype(df[column_name]):
                    mval = [int(val) if val.dtype == 'int64' else float(val) for val in  [df[column_name].mean()]][0]
                    unique_values = [mval]                    
                elif pd.api.types.is_datetime64_any_dtype(df[column_name]):
                        min_date = df[column_name].min()
                        max_date = df[column_name].max()
                        unique_values = [min_date.strftime('%Y-%m-%d'), max_date.strftime('%Y-%m-%d')]                 
                else:
                    unique_values = list(df[column_name].unique())
                meta_data_dict['metric'][column_name] = {'regexes': regexes+metric_regexes, 
                                                            'Unique Values': unique_values,
                                                            'GMD Name': metric_name}
                    
                flag = 1

                if not column_name in list_of_metrics:
                    list_of_metrics.append(column_name)

                if column_name not in graph:
                    graph.add_node(column_name, file_names=[file_name])

                else:
                    if file_name not in graph.nodes[column_name]['file_names']:
                        graph.nodes[column_name]['file_names'].append(file_name)
                break
        
        if flag == 0:
            for dimension_name, dimension_regexes in gmd_dict['dimensions'].items():
                if any(re.search(r"\b{}\b".format(regex), dimension_name, re.IGNORECASE) for regex in regexes):
                    # print(df)
                    
                    #if numeric, take mean val
                    if pd.api.types.is_numeric_dtype(df[column_name]):
                        mval = [int(val) if val.dtype == 'int64' else float(val) for val in  [df[column_name].mean()]][0]
                        unique_values = [mval]          
                    #date dtype          :
                    elif pd.api.types.is_datetime64_any_dtype(df[column_name]):
                        min_date = df[column_name].min()
                        max_date = df[column_name].max()
                        unique_values = [min_date.strftime('%Y-%m-%d'), max_date.strftime('%Y-%m-%d')]
                    else:
                        unique_values = list(df[column_name].unique())
                    
                    meta_data_dict['dimensions'][column_name] = {'regexes': regexes+dimension_regexes,
                                                                    'Unique Values': unique_values,
                                                                    # 'Uni Vals': list(df[column_name].unique()),
                                                                    'GMD Name': dimension_name}

                    if not column_name in list_of_metrics:
                        list_of_metrics.append(column_name)

                    if column_name not in graph:
                        graph.add_node(column_name, file_names=[file_name])

                    else:
                        if file_name not in graph.nodes[column_name]['file_names']:
                            graph.nodes[column_name]['file_names'].append(file_name)
                    break
        
    if len(list_of_metrics)>=2:
        for node1, node2 in itertools.combinations(list_of_metrics, 2):
            # print(node1, node2)
            if not node1 == node2:
                if not graph.has_edge(node1, node2):
                    graph.add_edge(node1, node2, file_names=[file_name])
                    print('Added edge between {} and {}'.format(node1, node2))
                else:
                    print(graph.get_edge_data(node1, node2))
                    if file_name not in graph.edges[node1, node2]['file_names']:
                        graph.edges[node1, node2]['file_names'].append(file_name)
                    print('Updated edge between {} and {}'.format(node1, node2))


    return graph, meta_data_dict

def add_file_to_graph(file_path, read_func, file_name, aliases):
    """Adds a file to the graph"""
    #Check if a graph already exists in Graph folder
    graph = load_graph()
    if not graph:
        graph = nx.Graph()
    #load meta data
    meta_data_dict = load_meta_data()
    if not meta_data_dict:
        meta_data_dict = {'metric': {}, 'dimension': {}}
    
    #load gmd dict
    
    gmd_dict = load_gmd()

    if not gmd_dict:
        print('GMD not found')
        return jsonify({"message": "No GMD Dict found"})
    

    df = read_func(file_path)

    graph, meta_data_dict = add_file_to_graph_and_generate_meta_data(df, graph, meta_data_dict, gmd_dict, aliases, file_name)

    nx.write_gml(graph, os.path.join(os.path.dirname(__file__),'..', GRAPH_FOLDER, f'/graph.gml'))

    #Convert to parquet
    df = pl.from_pandas(df)

    df.write_parquet(os.path.join(os.path.dirname(__file__),'..', DATA_FOLDER, f'/{file_name}.parquet'))

    #save meta data
    with open(os.path.join(os.path.dirname(__file__), '..', META_DATA_FOLDER, f'metadata.json'), 'w') as outfile:
        json.dump(meta_data_dict, outfile)

    

##Finding edge attributes
def find_edge_attributes_with_indirect_connections(graph, nodes):
    edge_attributes = []  # Store the found edge attributes
    remaining_nodes = set(nodes)  # Track nodes that still need to be connected

    # Start with the first node as the master node
    while remaining_nodes:
        master_node = remaining_nodes.pop()

        # List of nodes to check connections with
        target_nodes = remaining_nodes.copy()

        for target in target_nodes:
            # Check if there's a direct connection
            if graph.has_edge(master_node, target):
                # If a direct edge exists, get its attributes and store them
                attrs = graph.get_edge_data(master_node, target)
                edge_attributes+=attrs['file_names']
                remaining_nodes.remove(target)
            else:
                # If no direct connection, check for an indirect path
                try:
                    path = nx.shortest_path(graph, source=master_node, target=target)
                    if all(node in graph.nodes for node in path):
                        # Collect edge attributes for all edges in the path
                        for i in range(len(path) - 1):
                            edge = graph.get_edge_data(path[i], path[i + 1])
                            edge_attributes+= edge['file_names']
                        remaining_nodes.remove(target)
                except nx.NetworkXNoPath:
                    # No path found between master_node and target, continue with the next target
                    return False
                    # continue

        # If not all nodes are connected, retry with one of the remaining nodes as the master
        if remaining_nodes:
            master_node = remaining_nodes.pop()
    if len(nodes) == 1 and len(edge_attributes) == 0:
        return graph.nodes[nodes[0]]['file_names']

    return list(set(edge_attributes)) #edge_attributes