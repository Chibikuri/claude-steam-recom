// model-check.js
// Anthropicの利用可能なモデルを確認するスクリプト
const axios = require('axios');
require('dotenv').config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function checkAvailableModels() {
  try {
    console.log('Anthropic APIの利用可能なモデルを確認中...');
    
    // まず最新バージョンのAPIでモデルリストを取得してみる
    try {
      const response = await axios.get('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      });
      
      console.log('利用可能なモデル:');
      console.log(JSON.stringify(response.data, null, 2));
      return;
    } catch (e) {
      console.log('モデルリスト取得エラー:', e.message);
      console.log('別の方法を試します...');
    }
    
    // 直接メッセージを送信して応答を確認
    const models = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2',
      'claude-2.0',
      'claude-2.1',
      'claude-instant-1',
      'claude-instant-1.2'
    ];
    
    for (const model of models) {
      try {
        console.log(`モデル ${model} をテスト中...`);
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: model,
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            }
          }
        );
        
        console.log(`モデル ${model} は利用可能です!`);
        console.log(response.data);
        break;
      } catch (error) {
        console.log(`モデル ${model} でエラー: ${error.message}`);
        if (error.response) {
          console.log('エラーレスポンス:', error.response.data);
        }
      }
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkAvailableModels();