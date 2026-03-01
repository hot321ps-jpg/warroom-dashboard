// app/api/twitch/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const targetChannel = 'nayabnb'; // 目標頻道

  // 如果沒有設定金鑰，直接報錯提示
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: '尚未設定 Twitch API 金鑰' }, { status: 500 });
  }

  try {
    // 1. 取得 Access Token
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST', cache: 'no-store' }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. 查詢頻道開台狀態
    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${targetChannel}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
        },
        cache: 'no-store' 
      }
    );
    const streamData = await streamResponse.json();

    // 3. 整理回傳資料
    const isLive = streamData.data && streamData.data.length > 0;
    const currentViewers = isLive ? streamData.data[0].viewer_count : 0;
    const streamTitle = isLive ? streamData.data[0].title : '目前未開台';

    return NextResponse.json({
      channel: targetChannel,
      isLive,
      currentViewers,
      streamTitle,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twitch API 錯誤:', error);
    return NextResponse.json({ error: '無法取得資料' }, { status: 500 });
  }
}
