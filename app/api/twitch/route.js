import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const targetChannel = 'nayabnb';

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

    const headers = {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
    };

    // 2. 取得 User ID (必須先用頻道名稱換取 ID 才能查追隨者)
    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${targetChannel}`,
      { headers, cache: 'no-store' }
    );
    const userData = await userResponse.json();

    if (!userData.data || userData.data.length === 0) {
        return NextResponse.json({ error: '找不到該頻道' }, { status: 404 });
    }
    const userId = userData.data[0].id;

    // 3. 查詢頻道開台狀態
    const streamResponse = await fetch(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      { headers, cache: 'no-store' }
    );
    const streamData = await streamResponse.json();

    // 4. 查詢總追隨者人數 (Followers)
    const followersResponse = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`,
      { headers, cache: 'no-store' }
    );
    const followersData = await followersResponse.json();

    // 5. 整理回傳資料
    const isLive = streamData.data && streamData.data.length > 0;
    const currentViewers = isLive ? streamData.data[0].viewer_count : 0;
    const streamTitle = isLive ? streamData.data[0].title : '目前未開台';
    const totalFollowers = followersData.total || 0;

    return NextResponse.json({
      channel: targetChannel,
      isLive,
      currentViewers,
      streamTitle,
      totalFollowers, // 新增這行：回傳總追隨者人數
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Twitch API 錯誤:', error);
    return NextResponse.json({ error: '無法取得資料' }, { status: 500 });
  }
}
