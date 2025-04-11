const config = {
  // CloudFormationのOutputsから取得する値
  REGION: process.env.REACT_APP_REGION,
  API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT,
  USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID,
  USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID
};

export default config;
