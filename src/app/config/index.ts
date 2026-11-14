import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,

  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  gemini_api_key:process.env.GEMINI_API_KEY,
  jwt_access_token_secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwt_access_token_expires_in: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  deepseek:{
    deepSeekApiKey:process.env.DEEPSEEK_API_KEY,
    deepSeekApiUrl:process.env.API_URL
  },

  jwt_refresh_token_secret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwt_refresh_token_expires_in: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  stripe_secret_key :process.env.STRIPE_SECRET_KEY,
  stripe_publish_key:process.env.PUBLISH_KEY,
  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  },
  app_base_url: process.env.APP_BASE_URL || 'http://localhost:3000',
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    api_key: process.env.GOOGLE_API_KEY,
    app_id: process.env.GOOGLE_APP_ID,
  },
  token_enc_key: process.env.TOKEN_ENC_KEY,
  license: {
    url: process.env.LICENSE_URL,
    anon_key: process.env.LICENSE_ANON_KEY,
    key: process.env.LICENSE_KEY,
    enabled: process.env.LICENSE_ENABLED !== 'false',
  },
};
