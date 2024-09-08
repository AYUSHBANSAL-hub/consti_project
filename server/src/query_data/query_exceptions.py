import polars as pl
import pandas as pd
from src.gmd_utils.search_in_meta_data import load_meta_data
from src.Utils.Config import EXCEPTION_REGEXES
import re


def separate_exception_entities(sentence, entities):
    # entities = [entity.lower() for entity in entities]
    # Regex pattern to capture entities after "except" until "and", then a single word after "and"
    # pattern = r'(?:except|not)\s*(.*?)\s+and\s+(\w+)'
    pattern = EXCEPTION_REGEXES
    # Find matches using the pattern
    match = re.search(pattern, sentence, re.IGNORECASE)
    exception_entities = []
    if match:
        ###Search entities in matched text
        text = match.group(0)
        
        for entity in entities:
            if re.search(r'\b'+entity + r'\b', text, re.IGNORECASE):
                exception_entities.append(entity)

    # Classify entities into exception and non-exception lists
    non_exception_entities = [entity for entity in entities if entity not in exception_entities]
    
    return exception_entities, non_exception_entities