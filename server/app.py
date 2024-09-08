"""Main APP.PY for building API Functions"""

import json
import os
import polars as pl
from flask import Flask, jsonify, request, send_file, redirect, url_for, flash, send_from_directory
from flask_cors import CORS
import re
import pandas as pd
import networkx as nx

from src.Utils. Config import WORDS_TO_REMOVE, UPLOAD_FOLDER, DATA_FOLDER, META_DATA_FOLDER, GRAPH_FOLDER
from src.query_data.get_data import fetch_data
from src.query_data.get_data_helper import query_info
from src.add_file.file_checks import allowed_file
from werkzeug.utils import secure_filename
from src.graph_utils.Graph_funcs import add_file_to_graph
from src.query_data.get_data_helper import comparison_handler
from src.query_data.filters_and_aggregation_search import extract_top_or_bottom_n
from src.Insight_logic.suggestion import get_suggestions
from src.Insight_logic.suggestions_config import GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS
from src.Insight_logic.theta import do_theta_threshold_checks
from src.Utils.load_funcs import load_meta_data, load_graph
from src.Insight_logic.trigger_global_configs import Global_Checks
from src.add_file.add_file_main import give_mappings, add_mappings_to_graph_and_meta_data
from src.Utils.load_funcs import load_meta_data, load_gmd, load_graph

graph = load_graph()
meta_data = load_meta_data()

df = None 
resdf = None 
aggregations = None 
list_to_groupby = None 
after_comp = None 
list_of_nodes = None 
metric_list = None 
user_inp =None
dimension_data = None
dimension_values = None
dimension_list = None
suggestions = None
metric_removed = {}
removed_aggregation = {}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000","methods": ["GET", "POST", "OPTIONS"]}},)


app.config['UPLOAD_FOLDER'] = 'cache'


def create_app():
    """Create Application"""
    application = Flask(__name__)
    return application


@app.after_request
def add_cache_control(response):
    """Cache Control"""
    should_cache = (
        response.status_code == 200
        and request.method == "GET"
        and not response.cache_control.no_store
        and not response.cache_control.private
    )

    if should_cache:
        response.headers["Cache-Control"] = "public, max-age=600"

    return response


@app.route("/permission")
def permission():
    """Check For User Permission"""
    url_params = request.args.to_dict()
    # email_id = url_params.pop("email", None)
    # data_input = pl.LazyFrame()
    # data_input, permission_banner = get_user_access_level(
    #     email_id, data_input, "home_page"
    # )
    # del data_input
    # return jsonify({"header": permission_banner})


@app.route("/")
def hello_world():
    """Home Page!!"""
    return json.dumps("Hello, World ig?")


@app.route('/upload', methods=['POST'])
def upload_file():
    """Initial mappings"""
    gmd_dict = load_gmd()

    if 'file' not in request.files:
        # flash('No file part')
        return "No files part in the request", 400
    
    files = request.files.getlist('file')
    out = {}
    counter = 0
    for file in files:
        if file:
            allowed, read_func = allowed_file(file.filename)

            if allowed:
                filename = secure_filename(file.filename)

                file_path = os.path.join(os.path.dirname(__file__), 'cache', filename)
                df = read_func(file)
                out[counter] = give_mappings(df, gmd_dict)
                out[counter]['filename'] = filename
                # file.save(file_path)
                df.to_csv(file_path)
            else:
                out[counter] = {'Error': "Unsupported file type"}
            
            counter += 1
    print(out)
    # flash('Files reached the server successfully')
    return jsonify(out)


@app.route("/finalize_upload", methods=["POST"])
def finalize_upload():
    """Finalize the upload"""
    graph = load_graph('None')
    meta_store = load_meta_data('None')
    id_graph = nx.Graph()

    print("Inside finalize upload")
    print()


    ### get the mappings
    mappings = json.loads(request.data)["mappings"]
    print(mappings)
    gmd_dict = load_gmd()
    k = 0
    for filex in os.listdir(os.path.join(os.path.dirname(__file__), app.config['UPLOAD_FOLDER'])):
        _, read_func = allowed_file(filex)
        ##Put the file in memory
        df = read_func(os.path.join(os.path.dirname(__file__), app.config['UPLOAD_FOLDER'], filex))
        ##Clear the cache
        os.remove(os.path.join(os.path.dirname(__file__), app.config['UPLOAD_FOLDER'], filex))
        current_df_mapping = mappings[str(k)]
        k += 1
        ##Update the graph and meta data
        graph, id_graph, meta_store = add_mappings_to_graph_and_meta_data(current_df_mapping, df, 'test', gmd_dict, graph, meta_store, id_graph)
        
        ##Save it in User data/file_datas folder in src
        df.to_csv(os.path.join(os.path.dirname(__file__), 'src', UPLOAD_FOLDER, filex), index=False)

    ###NOTE: TEMPORARY SAVE LOCATION, WILL BE CHANGED LATER WHEN MOVED TO GCS OR DATABASE

    #Save the graph
    with open(os.path.join(os.path.dirname(__file__), 'src', GRAPH_FOLDER, 'test2_graph.gml'), 'wb') as f:
        nx.write_gml(graph, f)
    #Save the meta data
    with open(os.path.join(os.path.dirname(__file__), 'src', META_DATA_FOLDER, 'test2_meta_data.json'), 'w') as f:
        json.dump(meta_store, f)
        
    return jsonify({"status": "ok"})



@app.route("/search", methods=["GET"])
def fetch_data_from_query():
    """Fetches the data from the query and returns the result"""
    global  df, resdf, aggregations, list_to_groupby, after_comp, list_of_nodes,metric_list, user_inp,dimension_data,dimension_values,dimension_list


    user_inp = re.sub(r"\b" + r"\b|\b".join(WORDS_TO_REMOVE) + r"\b", "", request.args.get("query"))
    email_id = request.args.get("email", 'test@test.com')
    
    i_df, df, resdf, aggregations, list_to_groupby, after_comp, list_of_nodes, metric_list,dimension_data,dimension_values,dimension_list = fetch_data(
        user_input=user_inp,
        # email_id=email_id
        )
    
    chart = get_chart(resdf, list_of_nodes,metric_list)

    filters = query_info(i_df, aggregations, after_comp,dimension_data,dimension_list, metric_list)

    query_results = {
        'title' : user_inp,
        'table' : {
            'headers': df.columns.to_list(),
            'data': df.to_dict(),
        },
        'columns': resdf.columns.to_list(),
        "chart":chart["chart"],
        "filters": filters
    }
    return jsonify(query_results)


def get_chart(g_df,list_of_nodes,metric_list,thres = 10):
    col_dict = g_df.nunique().to_dict()

    numeric_columns = g_df.select_dtypes(include=["int"])
    numeric_columns = [col for col in list_of_nodes if col in numeric_columns]

    d_list_to_be_inmap = [col for col in list_of_nodes if col not in numeric_columns]
    chart_data = {"chart":{}}

    if not numeric_columns or not d_list_to_be_inmap:
        return chart_data 
    
    # Remade this order_dic based on column name and give preferrence accordingly 
    order_dict = {"City" :4,
                    "Territory":3,	
                    "State":2,	
                    "Region":1,	
                    "Partner Name":5,	
                    "Store Name":6}
    
    

    
    to_be_inmap = []
    top_10_inmap = {}
    ''' This for loop will look for all column which has unique value less than or equal to 10, and for those
        whose unique value is more than 10 there it will take top 10 value based on the matrix list element.'''
    for i in d_list_to_be_inmap:
        if i not in numeric_columns:
            if col_dict[i] <= thres:
                to_be_inmap.append(i)
            else:
                k = g_df.groupby(i)[list(metric_list.keys())[0]].sum().reset_index()
                top_10_ele = k.sort_values(by=list(metric_list.keys())[0], ascending=False).head(10)[i].tolist()
                to_be_inmap.append(i)
                top_10_inmap[i] = top_10_ele

    # Based on the order_dict dictonary it will sort the to_be_inmap list 
    to_be_inmap = sorted(to_be_inmap, key=lambda x: order_dict.get(x, float('inf')))

    if top_10_inmap: 
        for i in top_10_inmap.keys():
            g_df = g_df[g_df[i].isin(top_10_inmap[i])].reset_index(drop=True)


    if len(to_be_inmap) == 0:
        print(f"None of column is less than threshold :{thres}")

    elif len(to_be_inmap) == 1:
        product_colname = to_be_inmap[0]
    elif len(to_be_inmap) == 2: 
        product_colname = "product"
        g_df[product_colname] = g_df[to_be_inmap[0]].astype(str)+":"+g_df[to_be_inmap[1]].astype(str)
    else:
        product_colname = "product"
        g_df[product_colname] = g_df[to_be_inmap[0]].astype(str)+":"+g_df[to_be_inmap[1]].astype(str)
        for i in to_be_inmap[2:]:
            g_df[product_colname] = g_df[product_colname]+":"+g_df[i].astype(str)

    # print(metric_list)
        # Date column name should change according to the dataframe 
    for name , group in g_df.groupby(product_colname):
        chart_data["chart"][name] = {}
        chart_data["chart"][name]["data"] = group[["Date",list(metric_list.keys())[0]]].groupby("Date").sum().reset_index().set_index("Date")[list(metric_list.keys())[0]].to_dict()

    return chart_data




@app.route("/chart_gbm", methods=["GET"])
def chart_gbm():
    global resdf
    
    if resdf is None:
        app.logger.error("resdf is None.")
        return {"error": "No data available"}, 500
    
    g_df = resdf.copy()
    
    gby_col = request.args.get("groupby_col")
    bkd_col = request.args.get("breakdown_col")
    mat_col = request.args.get("metric")
    chart_type = request.args.get("chart_type") or "line"
    
    if not all(col in g_df.columns for col in [gby_col, bkd_col, mat_col]):
        return {"error": "Invalid columns specified."}, 400

    order_dict = {
        "City": 4,
        "Territory": 3,
        "State": 2,
        "Region": 1,
        "Partner Name": 5,
        "Date":7,
        "Store Name": 6
    }

    if gby_col not in order_dict or bkd_col not in order_dict:
        return {"error": "Columns not found in order dictionary."}, 400

    if order_dict[gby_col] > order_dict[bkd_col]:
        g_df["product_name"] = g_df[gby_col] + ":" + g_df[bkd_col]
    else:
        g_df["product_name"] = g_df[bkd_col] + ":" + g_df[gby_col]

    if chart_type == "line":
        chart_data = {"chart": {}}
        for name, group in g_df.groupby("product_name"):
            chart_data["chart"][name] = {}
            chart_data["chart"][name]["data"] = group[["Date", mat_col]].groupby("Date").sum().reset_index().set_index("Date")[mat_col].to_dict()

        return chart_data["chart"]

    elif chart_type == "bar":
        # Group data by categories and series
        grouped_data = g_df.groupby([gby_col, bkd_col])[mat_col].sum().unstack().fillna(0)
        
        # Prepare data format
        categories = list(grouped_data.index)
        transposed_data = grouped_data.to_dict(orient='list')

        # Construct series data
        series_data = []
        for company, values in transposed_data.items():
            series_data.append({
                "name": company,
                "data": values
            })

        chart_data = {
            "categories": categories,
            "series": series_data
        }

        return chart_data

    else:
        return {"error": "Invalid chart type specified. Choose either 'line' or 'bar'."}, 400


@app.route("/get_column", methods=["GET"])
def add_dynamic_cols():
    global  resdf, aggregations, list_to_groupby, after_comp, list_of_nodes, metric_list, user_inp, metric_removed, removed_aggregation
    
    col =request.args.get("dynm_col")
    col = [col]
    if_delete = request.args.get("if_delete")
    if type(if_delete)==str:
        if_delete = True if if_delete.lower() == "true" else False
    # It should be true or false type on ascending 
    asc_desc = request.args.get("asc_desc")
    if type(asc_desc)==str:
        asc_desc = True if asc_desc.lower() == "true" else False


    g_df = resdf.copy()

    # update list of node
    if if_delete:
        list_of_nodes = list(set(list_of_nodes) - set(col))
        if col[0] in list_to_groupby:
            list_to_groupby = list(set(list_to_groupby) - set(col))
        
        # removed_from_metric_list = metric_list.pop(col[0], None) 
        if col[0] in metric_list:
            metric_removed[col[0]] = metric_list.pop(col[0]) 
        
        if col[0] in aggregations:
            removed_aggregation[col[0]] = aggregations.pop(col[0])
        
    else:

        if metric_removed:
            if col[0] in metric_removed:
                metric_list[col[0]] = metric_removed.pop(col[0])
        if removed_aggregation:
            if col[0] in removed_aggregation:
                aggregations[col[0]] = removed_aggregation.pop(col[0])

        list_of_nodes += col

    #new df with required cols
    g_df = g_df[list_of_nodes]
    
    numeric_columns = g_df.select_dtypes(include=[int, float]) \
                        .columns.difference(g_df.select_dtypes(include=['datetime', 'object', 'string']).columns)
    
    #On add dynamic col, if the column is not numeric, then we do not want to group by it
    if not if_delete:
        col = [val for val in col if not val in numeric_columns]
        list_to_groupby = list(set(list_to_groupby + col))
    
    #Grouping, comparisons and aggregation
    if list_to_groupby:
        if not numeric_columns.empty:
            #if user defines an aggregation, use it
            if aggregations:
                #Assumption: if an entity say sales is asked in query then it is only asked like  sales >/</= 5000 or avg/agg sales </>/= 5000
                # not like avg sales where sales are greater than 5000 
                
                for col in g_df.columns:
                    if col not in aggregations and col in numeric_columns:
                        aggregations[col] = 'sum'
                g_df = g_df.groupby(list_to_groupby).agg(aggregations).reset_index()

                if after_comp:
                    # if any items from after comp are present, then apply it
                    after_comp_t = [comp for comp in after_comp if comp[0] in g_df.columns]

                    g_df = comparison_handler(after_comp_t, g_df)
                    
            else:
                #else use sum as default
                g_df = g_df.groupby(list_to_groupby).sum().reset_index()
        else:
            #if there are no numeric columns then take first from groupby
            print('No numeric present')
            g_df = g_df.groupby(list_to_groupby).first().reset_index()
    else:
        # df = df.sum().reset_index()
       
        rem_cols = list(g_df.columns.difference(numeric_columns))
        
        if not numeric_columns.empty:
            #if user defines an aggregation, use it
            if aggregations:
                #Assumption: if an entity say sales is asked in query then it is only asked like  sales >/</= 5000 or avg/agg sales </>/= 5000
                # not like avg sales where sales are greater than 5000 
                
                for col in g_df.columns:
                    if col not in aggregations and col in numeric_columns:
                        aggregations[col] = 'sum'
                if rem_cols:
                    g_df = g_df.groupby(rem_cols).agg(aggregations).reset_index()
                else:
                    g_df = g_df.agg(aggregations).reset_index(drop=True)

                if after_comp:
                    g_df = comparison_handler(after_comp, g_df)
                    
            else:
                #else use sum as default
                if rem_cols:
                    g_df = g_df.groupby(rem_cols).sum().reset_index()
                else:
                    g_df = g_df.agg(['sum']).reset_index(drop=True)

    top_or_bottom_n = extract_top_or_bottom_n(user_inp)

    if asc_desc == None:
        g_df = g_df.sort_values(by = list(metric_list.keys()),ascending=False).reset_index(drop=True)
    else:
        g_df = g_df.sort_values(by = list(metric_list.keys()),ascending=asc_desc).reset_index(drop=True)


    if top_or_bottom_n:
        # if top_or_bottom_n[0]=='top':
        #     df = df.sort_values(by = list(metric_list.keys())).reset_index(drop=True)
        if top_or_bottom_n[0]=='bottom':
            if metric_list:
                df = df.sort_values(by = list(metric_list.keys()), ascending=False).reset_index(drop=True)
            else:
                df = df.sort_values(by = list(df.columns), ascending=False).reset_index(drop=True)

        if top_or_bottom_n[1] is None:
            top_or_bottom_n[1] = len(g_df)
        g_df = g_df.head(top_or_bottom_n[1]).reset_index(drop=True)


    query_results = {
        'table' : {
            'headers': g_df.columns.to_list(),
            'data': g_df.to_dict(),
        },
    }
    return query_results

@app.route("/get_suggestion", methods=["GET"])
def get_suggestion():
    ################################################# NOTE: All names mentioned here are GMD names

    global list_of_nodes, user_inp, metric_list, dimension_values, dimension_list, resdf, suggestions
    # Default suggestion
    # suggestions = {0: {'Suggestion': 'No suggestions found. Try changing the filter conditions.'}}
    suggestions = {}
    metrics = {val['GMD Name']:key for key, val in meta_data['metric'].items() if key in metric_list}
    
    # we are just checking presence of particular metric/s in user query
    # if some specific metrics are present we give their suggestion
    
    ALLOWED_METRICS_FOR_SUGGESTIONS = ['Sales', 'Traffic', 'week of supply']
    
    found_metrics = [key for key in metrics.keys() if key in ALLOWED_METRICS_FOR_SUGGESTIONS]
    
    if found_metrics:
        overall_suggestions = []
        suggestion_info_for_deep_dive = {}
        
        for metric in found_metrics:
            list_of_columns_to_be_present_for_trigger_check = GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS[metric][0]
            list_of_column_checks = GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS[metric][1]
        
            suggestions = get_suggestions(resdf, graph, metric, user_inp, list_of_nodes, metric_list, dimension_values, dimension_data, dimension_list, list_of_columns_to_be_present_for_trigger_check, list_of_column_checks)    
            # print(suggestions)
            # if suggestions['Filters Info']:
            #     suggestions = do_theta_threshold_checks(metric, list_of_columns_to_be_present_for_trigger_check, list_of_column_checks, resdf, list_of_nodes, user_inp, metric_list, dimension_values, dimension_list)
            #     overall_suggestions += [f"No threshold match for {metric}, please click here to get theta based threshold results for {metric}"]
            # # overall_suggestions.update({k + current_size: v['Suggestion'] for k, v in suggestions.items()})
            overall_suggestions += [v['Suggestion'] for k, v in suggestions.items()]

        return  jsonify(overall_suggestions)

    else:
        return  jsonify(['No suggestions found. Try changing the filter conditions.'])
    
    # return jsonify({k:suggestions[k]['Suggestion'] for k in suggestions.keys()})

###Gotta make this an endpoint later
def deep_dive_into_suggestion():
    #Assuming we get index from frontend
    index = request.args.get("index_key")
    global list_of_nodes, user_inp, metric_list, dimension_values, dimension_list, resdf, suggestions
    if index and suggestions:
        selected_suggestion_info = suggestions[index]['Filters Info']
        metric = selected_suggestion_info['Metric']
        list_of_columns_to_be_present_for_trigger_check = GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS[metric][0]
        list_of_column_checks = GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS[metric][1]

        trig_check_cols = Global_Checks[metric]['Trigger Check Columns'][selected_suggestion_info['Trend']]
        date_col = [val['GMD Name'] for val in meta_data['dimensions'].values() if val['GMD Name'] == 'Date'][0]
        if date_col in selected_suggestion_info['Associated df'].columns:
            dates = selected_suggestion_info['Associated df'][date_col].to_list()
        responses2 = []
        backend_info_for_actions = {}

        for col in trig_check_cols:
            #traverse through threshold dictionary to get threshold
            
            filters  =  selected_suggestion_info['Filter_Variables']
            filters[date_col]  =  dates

            suggest2 = get_suggestions(resdf, graph, col, user_inp, list_of_nodes, metric_list, dimension_values, dimension_list, list_of_columns_to_be_present_for_trigger_check, list_of_column_checks, filters = filters)
            
            responses2.append(v['Suggestion'] for k, v in suggest2.items())

        return jsonify(responses2)
    else:
        return jsonify(['No extra suggestions'])
    
def bar_graph():
    return



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
