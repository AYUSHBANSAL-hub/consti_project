import pandas as pd
ALLOWED_EXTENSIONS = {"csv": pd.read_csv,
                     'xlsx': pd.read_excel,
                     'xls': pd.read_excel,
                     'parquet': pd.read_parquet
                     }

COLS_TO_ASK_OR_CHECK_PRESENCE_WHILE_ADDING_FOR_A_METRIC = {
    'Sales': ['Product Name', 'Date'],
    'Traffic': ['Product Name', 'Date'],
    'week of supply': ['Product Name', 'Date'],
    'MSRP': ['Product Name', 'Date'],
    'ASP': ['Product Name', 'Date'],
    'Promo Value': ['Product Name', 'Date'],
    'Search Trend': ['Product Name', 'Date'],
}
