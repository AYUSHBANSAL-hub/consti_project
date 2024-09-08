from src.Insight_logic.trigger_actions import *

####NOTE: ALL names here are GMD names from sales to traffic everything should be in same way as it is in GMD dictionary/data
#### Put all other names in lower case

sales_checks = {
                #+ive threshold      #-ve threshold
    'thresholds': {'bestbuy':{'west':[5000, 500],
                              'east':[5000, 100],
                              'midwest':[5000, 100],
                              'northeast':[5000, 100],
                              'northwest':[5000, 100],
                              'southeast':[5000, 100],
                              'southwest':[5000, 100],
                              'south':[5000, 100],
                              'north':[5000, 100],
                                },

                   'walmart':{'west':[7000, 100],
                              'east':[7000, 100],
                              'midwest':[7000, 100],
                              'northeast':[7000, 100],
                              'northwest':[7000, 100],
                              'southeast':[7000, 100],
                              'southwest':[7000, 100],
                              'south':[7000, 100],
                              'north':[7000, 100],
                                },
                   },


    # 'Response': ['Sales up', 'Sales down', 'Sales both up and down'],
    'Trigger Check Columns': {
        'Up': ['week of supply'],
        'Down': ['Traffic'],
    }
}

wos_checks = {
                #+ive threshold      #-ve threshold
    'thresholds': {'bestbuy':{'west':[284750, 28475],
                              'east':[7000, 100],
                              'midwest':[7000, 100],
                              'northeast':[7000, 100],
                              'northwest':[7000, 100],
                              'southeast':[7000, 100],
                              'southwest':[7000, 100],
                              'south':[7000, 100],
                              'north':[7000, 100],
                                },

                   'walmart':{'west':[7000, 100],
                              'east':[7000, 100],
                              'midwest':[7000, 100],
                              'northeast':[7000, 100],
                              'northwest':[7000, 100],
                              'southeast':[7000, 100],
                              'southwest':[7000, 100],
                              'south':[7000, 100],
                              'north':[7000, 100],
                                },
                   },


    # 'Response': ['Sales up', 'Sales down', 'Sales both up and down'],
    'Trigger Check Columns': {
        'Up': [],
        'Down': [],
    }
}

traffic_checks = {
                #+ive threshold      #-ve threshold
    'thresholds': {'bestbuy':{'west':[7000, 500],
                              'east':[7000, 100],
                              'midwest':[7000, 100],
                              'northeast':[7000, 100],
                              'northwest':[7000, 100],
                              'southeast':[7000, 100],
                              'southwest':[7000, 100],
                              'south':[7000, 100],
                              'north':[7000, 100],
                                },

                   'walmart':{'west':[7000, 100],
                              'east':[7000, 100],
                              'midwest':[7000, 100],
                              'northeast':[7000, 100],
                              'northwest':[7000, 100],
                              'southeast':[7000, 100],
                              'southwest':[7000, 100],
                              'south':[7000, 100],
                              'north':[7000, 100],
                                },
                   },


    # 'Response': ['Sales up', 'Sales down', 'Sales both up and down'],
    'Trigger Check Columns': {
        'Up': [],
        'Down': [],
    }
}



Global_Checks = {
    'Sales': sales_checks,
    'Traffic': traffic_checks,
    'week of supply': wos_checks,
}


# Sales_checks = {
#                 #+ive threshold      #-ve threshold
#     'threshold': [700,            100],

#     # 'Response': ['Sales up', 'Sales down', 'Sales both up and down'],

#     'Trigger Check Columns': {
#         'Up': ['WOS'],
#         'Down': ['Traffic'],
#     }

#     # 'Trigger Check Columns': [
#     #     'Traffic',
#     #     'WOS',
#     #     ]
#     }

# Traffic_checks = {
#     'threshold': [9554195,            1000],

#     # 'Response': ['Traffic up', 'Traffic down', 'Traffic both up and down'],

#     'Trigger Check Columns': {
#         # 'Sales'
#         # 'WOS'
#     }
# }

# wos_checks = {
#     'threshold': [9554195,            1000],

#     # 'Response': ['WOS up', 'WOS down', 'WOS both up and down'],

#     'Trigger Check Columns': {
#         # 'Sales'
#         # 'Traffic'
#     }
# } 

# Global_Checks = {
#     'Sales': Sales_checks,
#     'Traffic': Traffic_checks,
#     'WOS': wos_checks,
# }

