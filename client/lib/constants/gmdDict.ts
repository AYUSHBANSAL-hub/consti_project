// export const gmdDict: { [key: string]: { [key: string]: RegExp[] } } = {
//   metric: {
//     MSRP: [new RegExp("msrp")],
//     ASP: [new RegExp("asp")],
//     Sales: [new RegExp("sales?")],
//     "Promo Value": [new RegExp("promotions")],
//     Traffic: [new RegExp("traffic"), new RegExp("sot")],
//     "Search Trend": [new RegExp("trend")],
//     "Review Sentiment": [new RegExp("review sentiment")],
//     "Star Rating": [new RegExp("star rating")],
//     "Star Rating Count": [new RegExp("star rating count")],
//     "Review Rating": [new RegExp("review rating")],
//     "Review Count": [new RegExp("review count")],
//   },

//   dimensions: {
//     Date: [new RegExp("dates?")], // Regular expression
//     Week: [new RegExp("weeks?")], // Regular expression
//     City: [new RegExp("city")],
//     Territory: [new RegExp("territory")],
//     Region: [new RegExp("region")],
//     State: [new RegExp("state")],
//     "Store Name": [new RegExp("stores")],
//     "TSM Name": [new RegExp("tsm name")],
//     Coverage: [new RegExp("coverage")],
//     Tiering: [new RegExp("tier")],
//     Quarter: [new RegExp("quarter")],
//     "Traffic Breakdown": [new RegExp("traffic breakdown")],
//     Visits: [new RegExp("tsm frequency, visit")],
//     "Effective Offer": [new RegExp("offer")],
//     "Promo Type": [new RegExp("promo type")],
//     "Price Segment": [new RegExp("premium segment"), new RegExp("non premium")],
//     Brand: [new RegExp("brand")],
//     "Product Name": [new RegExp("product")],
//     "Partner Name": [new RegExp("partner")],
//     Country: [new RegExp("country")],
//     "Release Date": [new RegExp("launch date")],
//     "dealer type": [new RegExp("dealer")],
//   },
// };

// export const gmdMetadata: {
//   [key: string]: { [key: string]: { description: string; dataType: string } };
// } = {
//   metric: {
//     MSRP: {
//       description: "Manufacturer Suggested Retail Price",
//       dataType: "number",
//     },
//     ASP: { description: "Average Selling Price", dataType: "number" },
//     Sales: { description: "Total sales amount", dataType: "number" },
//     "Promo Value": { description: "Value of promotions", dataType: "number" },
//     Traffic: {
//       description: "Traffic volume or engagement",
//       dataType: "number",
//     },
//     "Search Trend": {
//       description: "Search trend over time",
//       dataType: "number",
//     },
//     "Review Sentiment": {
//       description: "Sentiment analysis of reviews",
//       dataType: "string",
//     },
//     "Star Rating": { description: "Average star rating", dataType: "number" },
//     "Star Rating Count": {
//       description: "Count of star ratings",
//       dataType: "number",
//     },
//     "Review Rating": {
//       description: "Average rating from reviews",
//       dataType: "number",
//     },
//     "Review Count": { description: "Number of reviews", dataType: "number" },
//   },

//   dimensions: {
//     Date: { description: "Date of the data entry", dataType: "date" },
//     Week: { description: "Week number or identifier", dataType: "date" },
//     City: { description: "City name", dataType: "string" },
//     Territory: {
//       description: "Territory name or identifier",
//       dataType: "string",
//     },
//     Region: { description: "Region name or identifier", dataType: "string" },
//     State: { description: "State name or abbreviation", dataType: "string" },
//     "Store Name": { description: "Name of the store", dataType: "string" },
//     "TSM Name": {
//       description: "Name of the Territory Sales Manager",
//       dataType: "string",
//     },
//     Coverage: { description: "Coverage area or scope", dataType: "string" },
//     Tiering: { description: "Tier or level", dataType: "string" },
//     Quarter: { description: "Quarter of the year", dataType: "string" },
//     "Traffic Breakdown": {
//       description: "Breakdown of traffic sources",
//       dataType: "string",
//     },
//     Visits: { description: "Number of visits", dataType: "number" },
//     "Effective Offer": {
//       description: "Details of the effective offer",
//       dataType: "string",
//     },
//     "Promo Type": { description: "Type of promotion", dataType: "string" },
//     "Price Segment": {
//       description: "Price segment of the product",
//       dataType: "string",
//     },
//     Brand: { description: "Brand name", dataType: "string" },
//     "Product Name": { description: "Name of the product", dataType: "string" },
//     "Partner Name": { description: "Name of the partner", dataType: "string" },
//     Country: { description: "Country name", dataType: "string" },
//     "Release Date": {
//       description: "Date the product was released",
//       dataType: "string",
//     },
//     "dealer type": { description: "Type of dealer", dataType: "string" },
//   },
// };

// type Metadata = {
//   description: string;
//   dataType: string;
// };

// export function getMetadata(key: string): Metadata | undefined {
//   if (gmdMetadata.metric[key]) {
//     return gmdMetadata.metric[key];
//   }

//   if (gmdMetadata.dimensions[key]) {
//     return gmdMetadata.dimensions[key];
//   }

//   return undefined;
// }

export const gmdDict: { [key: string]: { [key: string]: RegExp[] } } = {
  metric: {
    MSRP: [new RegExp("msrp")],
    ASP: [new RegExp("asp")],
    Sales: [new RegExp("sales?")],
    "Promo Value": [new RegExp("promo value")],
    Traffic: [new RegExp("traffic")],
    "Search Trend": [new RegExp("trend")],
    "Consumer Sentiment": [new RegExp("sentiment")],
    "week of supply": [new RegExp("week of supply"), new RegExp("wos")],
  },

  dimensions: {
    Date: [new RegExp("dates?")],
    Week: [new RegExp("weeks?")],
    City: [new RegExp("city")],
    "Location 1": [new RegExp("territory")],
    "Location 2": [new RegExp("region")],
    State: [new RegExp("state")],
    "Store Name": [new RegExp("store name")],
    TSM: [new RegExp("tsm")],
    Coverage: [new RegExp("coverage")],
    Tiering: [new RegExp("tiering")],
    Quarter: [new RegExp("quarter")],
    "Traffic Breakdown": [new RegExp("traffic breakdown")],
    visit_count: [new RegExp("visit count"), new RegExp("visits?")],
    "Effective Offer": [new RegExp("effective offer")],
    "Promo Type": [new RegExp("promo type")],
    "Price Segment": [new RegExp("price segment")],
    Brand: [new RegExp("brand")],
    "Product Name": [new RegExp("product name")],
    Partner: [new RegExp("partner")],
    Country: [new RegExp("country")],
    "Release Date": [new RegExp("launch date")],
  },

  ID: {
    ID: [new RegExp("\\bUID\\b")],
  },
};

export const gmdMetadata: {
  [key: string]: { [key: string]: { description: string; dataType: string } };
} = {
  metric: {
    MSRP: {
      description: "Manufacturer Suggested Retail Price",
      dataType: "string",
    },
    ASP: { description: "Average Selling Price", dataType: "number" },
    Sales: { description: "Total sales amount", dataType: "number" },
    "Promo Value": { description: "Value of promotions", dataType: "number" },
    Traffic: {
      description: "Traffic volume or engagement",
      dataType: "number",
    },
    "Search Trend": {
      description: "Search trend over time",
      dataType: "number",
    },
    "Consumer Sentiment": {
      description: "Sentiment analysis of consumer feedback",
      dataType: "string",
    },
    "week of supply": {
      description: "Number of weeks of supply",
      dataType: "number",
    },
  },

  dimensions: {
    Date: { description: "Date of the data entry", dataType: "date" },
    Week: { description: "Week number or identifier", dataType: "date" },
    City: { description: "City name", dataType: "string" },
    "Location 1": {
      description: "Territory name or identifier",
      dataType: "string",
    },
    "Location 2": {
      description: "Region name or identifier",
      dataType: "string",
    },
    State: { description: "State name or abbreviation", dataType: "string" },
    "Store Name": { description: "Name of the store", dataType: "string" },
    TSM: { description: "Territory Sales Manager name", dataType: "string" },
    Coverage: { description: "Coverage area or scope", dataType: "string" },
    Tiering: { description: "Tier or level", dataType: "string" },
    Quarter: { description: "Quarter of the year", dataType: "string" },
    "Traffic Breakdown": {
      description: "Breakdown of traffic sources",
      dataType: "string",
    },
    visit_count: { description: "Number of visits", dataType: "number" },
    "Effective Offer": {
      description: "Details of the effective offer",
      dataType: "string",
    },
    "Promo Type": { description: "Type of promotion", dataType: "string" },
    "Price Segment": {
      description: "Price segment of the product",
      dataType: "string",
    },
    Brand: { description: "Brand name", dataType: "string" },
    "Product Name": { description: "Name of the product", dataType: "string" },
    Partner: { description: "Partner name", dataType: "string" },
    Country: { description: "Country name", dataType: "string" },
    "Release Date": {
      description: "Date the product was released",
      dataType: "string",
    },
  },

  ID: {
    UID: { description: "Unique Identifier", dataType: "number" },
    ID: { description: "ID field", dataType: "number" },
  },
};

type Metadata = {
  description: string;
  dataType: string;
};

export function getMetadata(key: string): Metadata | undefined {
  if (gmdMetadata.metric[key]) {
    return gmdMetadata.metric[key];
  }

  if (gmdMetadata.dimensions[key]) {
    return gmdMetadata.dimensions[key];
  }

  if (gmdMetadata.ID[key]) {
    return gmdMetadata.ID[key];
  }

  return undefined;
}
