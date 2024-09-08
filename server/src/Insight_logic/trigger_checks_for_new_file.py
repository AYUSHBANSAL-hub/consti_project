from src.Insight_logic.trigger_global_configs import Global_Checks

def get_checks_for_new_file(graph):
    ##Custom for now else can use company checks itself
    to_be_checked = ['Sales']
    available_cols_in_graph = list(graph.nodes)

    company_checks = Global_Checks.copy()
    for i in Global_Checks:
        if i in available_cols_in_graph:
            # if i not in to_be_checked:
            #     to_be_checked += [i]
            cols_present = list(set(Global_Checks[i]['Trigger Check Columns']) & set(available_cols_in_graph))

            company_checks[i]['Trigger Check Columns'] = cols_present