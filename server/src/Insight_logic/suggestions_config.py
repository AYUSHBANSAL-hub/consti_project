req_cols_for_traffic_Check = ['Partner', 'Location 2', 'Date']
req_cols_for_combo_check = ['Partner', 'Location 2']
###NOTE: Currently all metrics share same req cols for theshold checks, but for future use we can add different req cols for different metrics
### These current are spefcifically for 'Sales' as of current 05-09-24

GLOBAL_COLUMNS_LIST_FOR_METRIC_THRESHOLD_CHECKS = {
    'Traffic': [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'Sales' : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'MSRP'              : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'ASP'               : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'Sales'             : [req_cols_for_traffic_Check, req_cols_for_combo_check], 
    'Promo Value'             : [req_cols_for_traffic_Check, req_cols_for_combo_check], 
    'Traffic'           : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'Search Trend'      : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'Consumer Sentiment' : [req_cols_for_traffic_Check, req_cols_for_combo_check],
    'week of supply': [req_cols_for_traffic_Check, req_cols_for_combo_check],
}
