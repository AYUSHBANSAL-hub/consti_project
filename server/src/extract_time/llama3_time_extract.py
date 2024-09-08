import json
import torch
from torch import cuda, bfloat16
import transformers
from transformers import BitsAndBytesConfig
from src.Utils.Config import LLAMA3_MODEL_PTH
from transformers import (AutoTokenizer,
                          AutoModelForCausalLM,
                          BitsAndBytesConfig,
                          pipeline)
from datetime import datetime
from dateutil.relativedelta import relativedelta

class llama3_time_extract():
    def __init__(self):
        bnb_config = transformers.BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type='nf4',
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=bfloat16
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            LLAMA3_MODEL_PTH,
            # device_map="auto",
            # quantization_config=bnb_config,
            # token=HF_TOKEN,
            # cache_dir = 'cache_dir'
        )

        self.model.config.use_cache = False
        self.model.config.pretraining_tp = 1
        self.tokenizer = AutoTokenizer.from_pretrained(LLAMA3_MODEL_PTH)

        self.pipeline = transformers.pipeline(
        task = "text-generation",
        model = self.model,
        tokenizer = self.tokenizer,
        )
        self.terminators = [
        self.pipeline.tokenizer.eos_token_id,
        self.pipeline.tokenizer.convert_tokens_to_ids("<|eot_id|>")
        ]


        self.load_prompts()


    def load_prompts(self):
        current_date = datetime.now()
        day_of_week = current_date.strftime("%A")

        first_day_previous_month = (current_date - relativedelta(months=1)).replace(day=1)

        last_day_previous_month = first_day_previous_month + relativedelta(day=31)

        current_date = datetime.now().strftime("%Y-%m-%d")
        first_day_str = first_day_previous_month.strftime("%Y-%m-%d")
        last_day_str = last_day_previous_month.strftime("%Y-%m-%d")


        instruction_prompt_3_part1 = """Extract all dates, times, and relevant time ranges from the following statements and organize them in a structured JSON format and do not return any instructions or thoughts apart from the JSON output. For each statement:

        1. Identify any explicit or inferred dates and time ranges and specify it in arrays with respective keys.
        2. Include the relevant period if mentioned (["January 2024", "March 2024"] for the first quarter).
        3. Capture recurring events by indicating frequency (e.g., monthly, weekly, biweekly).
        4. If any key is not mentioned or can't be identified by the statement, set the field as null.
        5. wk stands for week and Q or q stands for quarter if not stated otherwise.
        6. If year is not mentioned and couldn't be inferred then assume it from today's date and use it in period with the month name. (like for "jan and may data" it would be ["January 2024", "May 2024" ] )"""
        instruction_prompt_3_part2 = f"""
        7. Today's date is {day_of_week}, {current_date}. use this as reference for questions where date is given relative like 'last week', 'last month', 'last quarter' etc. without any specific year or month given as reference.
        """
        instruction_prompt_3_part3 ="""
        Return the results in the following JSON structure:

        {
        "statement": "<original statement>",
        "dates": [
            {
            "date": ["YYYY-MM-DD"] or null,
            "time": ["HH:MM"] or null,
            "period": ["<period>"] or null,
            "frequency": "<frequency>" or null
            },
            ...
        ]
        }

        Example statements:
        1. "What is the bby sales in first quarter of 2023."
        2. "What is the bby sales from july to aug'23."
        3. "What are the monthly bby sales of 2023?"
        4. "Give sales of 2023 from week 11 to week 35"
        5. "What are the sales between Jan wk 1 and wk3"
        6. "What are the sales from wk3 jan to wk4 april"
        7. "What is the sales report for last month?"

        Output:
        {
        "statement": "What is the bby sales in third quarter of 2023.",
        "dates": [
            {
            "date": null,
            "time": null,
            "period": ["July 2023", "September 2023"],
            "frequency": null
            }
        ]
        },
        {
        "statement": "What is the bby sales from july to aug'23.",
        "dates": [
            {
            "date": null,
            "time": null,
            "period": ["July 2023", "August 2023"],
            "frequency": null
            }
        ]
        },
        {
        "statement": "What are the monthly BBY sales of 2023?",
        "dates": [
            {
            "date": null,
            "time": null,
            "period": ["January 2023", "December 2023"],
            "frequency": "monthly"
            }
        ]
        },
        {
        "statement": "Give sales of 2023 from week 11 to week 35",
        "dates": [
            {
            "date": [2023-03-13, 2023-09-03],
            "time": null,
            "period": ["March 2023, "September 2023"],
            "frequency": null
            }
        ]
        },
        {
        "statement": "What are the sales between Jan wk 1 and wk3",
        "dates": [
            {
            "date": [2023-01-01, 2023-01-21],
            "time": null,
            "period": ["January 2023"],
            "frequency": null
            }
        ]
        }
        {
        "statement": "What are the sales from wk3 jan to wk4 april",
        "dates": [
            {
            "date": [2023-01-21, 2023-04-28],
            "time": null,
            "period": ["January 2023", ""April 2023],
            "frequency": null
            }
        ]
        }
        {
        "statement": "What is the sales report for last month?",
        "dates": [
            {""" +f"""
            "date": [{first_day_str}, {last_day_str}],
        """ + """
            "time": null,
            "period": null,
            "frequency": null
            }
        ]
        }
        Here is the text for analysis:
        text: """

        self.sys_prompt =  instruction_prompt_3_part1 + instruction_prompt_3_part2 + instruction_prompt_3_part3


    def invoke(self, user_prompt,):
        messages = [
            {"role": "system", "content": self.sys_prompt},
            {"role": "user", "content": user_prompt},
        ]
        outputs = self.pipeline(
            messages,
            eos_token_id=self.terminators,
            do_sample=True,
            temperature=0.01,
            top_p=0.99,
            max_length=10000,
            truncation = True
        )
        assistant_response = outputs[0]["generated_text"][-1]["content"]
        return assistant_response

    def __call__(self, text):
        return self.invoke(text)