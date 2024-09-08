import os
import json
from src.Utils.Config import META_DATA_FOLDER, GMD_DICT_PATH, GRAPH_FOLDER
import networkx as nx

def load_gmd(file_name = 'gmd_dict.json'):
    gmd_path = os.path.join(os.path.dirname(__file__), '..' , GMD_DICT_PATH, file_name)
    if os.path.exists(gmd_path) == False:
        print('GMD path error ', gmd_path)
        return None
    with open(gmd_path) as json_file:
        gmd_dict = json.load(json_file)
        return gmd_dict

def load_meta_data(file_name= 'test_meta_data.json'):
    meta_data_path = os.path.join(os.path.dirname(__file__), '..' , META_DATA_FOLDER, file_name)
    if os.path.exists(meta_data_path) == False:
        print('Meta data path error, initializing with empty ', meta_data_path)
        meta_store = {'metric':{}, 'dimensions':{}, 'Location Cols': {}, 'Misc_info': {}} 
        return meta_store
    
    with open(meta_data_path) as json_file:
        meta_data = json.load(json_file)
        return meta_data
    
def load_graph(file_name= 'test_graph.gml'):
    graph_path = os.path.join(os.path.dirname(__file__), '..' , GRAPH_FOLDER, file_name)
                 
    if os.path.exists(graph_path) == False:
        print('Graph path error , initializing with empty', graph_path)
        graph= nx.Graph()
        return graph
    
    graph = nx.read_gml(graph_path)
    return graph