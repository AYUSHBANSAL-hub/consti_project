import re
from src.Utils. Config import COMPARISON_REGEXES, AGGREGATION_REGEXES, TOP_BOTTOM_REGEX

def extract_comparisons(sentence, entities):
    # Regular expression pattern to match phrases like "X is greater than 10" or "Y is less than 50"
    pattern = COMPARISON_REGEXES
    extracted_info = []

    # Find all matches in the sentence
    matches = re.findall(pattern, sentence, re.IGNORECASE)
    for match in matches:
        entity, comparison, number = match

        # Normalize the comparison phrases to their symbolic equivalents
        if comparison == "greater than or equal to" or comparison == "greater than or equals to":
            comparison = ">="
        if comparison == "less than or equal to" or comparison == "less than or equals to":
            comparison = "<="
        elif 'greater' in comparison.lower():
            comparison = ">"
        elif 'less' in comparison.lower():
            comparison = "<"
        else:
            comparison = "=="
        for ent in entities:
            if re.search(r"\b{}\b".format(ent), entity, re.IGNORECASE):
                extracted_info.append([ent, comparison, int(number)])

    return extracted_info



def extract_aggregations(sentence, entities):
    pat = AGGREGATION_REGEXES

    extracted_info = {}
    matches = re.findall(pat, sentence, re.IGNORECASE)
    for match in matches:
        if len(match)== 3:
            entity1, agg, entity2 = match
        elif len(match) == 2:
            entity1 = ''
            agg, entity2 = match
        else:
            return extracted_info
        # print(entity1, agg, entity2)
        for ent in entities:
            if agg.lower() not in ['median', 'mode', 'sum', 'count', 'counts', 'min', 'max']:
                agg = 'mean'
            # if re.search(r"\b{}\b".format(ent), entity2, re.IGNORECASE):
            if re.search(r'\b'+ r'\b|\b'.join(entities[ent]) + r'\b', entity2, re.IGNORECASE):
                if entity2 == '':
                    continue
                entity2 = re.split(r'\b'+ r'\b|\b'.join(entities[ent]) + r'\b', entity2)[0]
                
                # extracted_info.append([ent, agg, entity1])
                extracted_info[match] = [agg, ent, 2]
                
            if re.search(r'\b'+ r'\b|\b'.join(entities[ent]) + r'\b', entity1, re.IGNORECASE):
            # elif re.search(r"\b{}\b".format(ent), entity1, re.IGNORECASE):
                if entity1 == '':
                    continue
                entity1 = re.split(r'\b'+ r'\b|\b'.join(entities[ent]) + r'\b', entity1)[1]

                if match in extracted_info:
                    level = extracted_info[match][2]
                    if level == 2:
                        continue

                # extracted_info.append([ent, agg, entity1])
                extracted_info[match] = [agg, ent, 1]
    fin_aggs = {}
    for val in extracted_info.values():
        fin_aggs[val[1]] = val[0]
            
    return fin_aggs


def extract_top_or_bottom_n(sentence):
    pat = TOP_BOTTOM_REGEX[0]
    extracted_info = {}

    matches = re.search(pat, sentence, re.IGNORECASE)

    if matches:
        top_or_bottom = matches.group(1)
        if not top_or_bottom:
            top_or_bottom = matches.group(4)
            n = int(matches.group(3))
        else:
            n = int(matches.group(2))

        if top_or_bottom.lower() in ['top', 'largest', 'first' ]:
            top_or_bottom = 'top'
        elif top_or_bottom.lower() in ['bottom', 'last', 'smallest']:
            top_or_bottom = 'bottom'
        
        extracted_info = [top_or_bottom, n]
    else:
        pat2 = TOP_BOTTOM_REGEX[1]
        matches2 = re.search(pat2, sentence, re.IGNORECASE)
        if matches2:
            top_or_bottom = matches2.group(1)
            n = None
            if top_or_bottom.lower() in ['top', 'largest', 'first', 'highest', 'best', 'ascending order']:
                top_or_bottom = 'top'
            elif top_or_bottom.lower() in ['bottom', 'last', 'smallest', 'worst', 'lowest', 'descending order']:
                top_or_bottom = 'bottom'
            extracted_info = [top_or_bottom, n]

    return extracted_info
