const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const airtableApiKey = 'key6iKNmX2Ynpo6k8';
const airtableBase = 'appFRjFTs1w91uxZj';
const airtableTable = 'Payments';
const telegramToken = '6158390327:AAE6gOf4Mqv4F2zaNmFifhckauLdgiC9BRA';
const chatIds = ['593152072', '5272022550'];

let lastRecordTime = null;

const bot = new TelegramBot(telegramToken, {polling: true});

setInterval(async () => {
  try {
    const response = await axios.get(`https://api.airtable.com/v0/${airtableBase}/${airtableTable}`, {
      headers: {
        Authorization: `Bearer ${airtableApiKey}`
      },
      params: {
        sort: [{ field: 'createdTime', direction: 'desc' }],
        maxRecords: 1
      }
    });

    const record = response.data.records[0];

    if (!lastRecordTime || new Date(record.createdTime) > lastRecordTime) {
      lastRecordTime = new Date(record.createdTime);

      const amount = record.fields.Amount;
      const trafficSource = record.fields.TrafficSource;
      const buyerName = record.fields.Buyer_Name;
      const buyerUsername = record.fields.Buyer_Username;
      const service = record.fields.Service;
      const serviceInfo = record.fields.ServiceInfo;

      const message = `Paid: ${amount}\nTraffic Source: ${trafficSource}\nBuyer Name: ${buyerName}\nBuyer Username: ${buyerUsername}\nService: ${service}\nServiceInfo: ${serviceInfo}`;

      for (const chatId of chatIds) {
          await bot.sendMessage(chatId, message, {
            reply_markup: {
              inline_keyboard: [[
                { text: 'Yes', callback_data: `update_yulia_yes:${record.id}` },
                { text: 'No', callback_data: `update_yulia_no:${record.id}` }
              ]]
            }
          });
        }
      }
    } catch (err) {
      console.log('Error', err.message);
    }
  }, 10000);

bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data.split(':')[0];
  const recordId = callbackQuery.data.split(':')[1];

  if (action === 'update_yulia_yes') {
    try {
      await axios.patch(`https://api.airtable.com/v0/${airtableBase}/${airtableTable}/${recordId}`, {
        fields: {
          Yulia: true
        }
      }, {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.log('Error', err.message);
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

const app = express();

app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, function() {
    console.log('App is running, server is listening on port ', PORT);
});