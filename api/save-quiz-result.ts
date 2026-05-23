import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
}

const serverSupabase = createClient(supabaseUrl, serviceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { participant, response } = req.body || {};
    if (!participant || !response) return res.status(400).json({ error: 'Missing participant or response payload' });

    const { data: participantData, error: participantError } = await serverSupabase
      .from('participants')
      .insert({
        full_name: participant.full_name,
        email: participant.email,
        mobile: participant.mobile,
      })
      .select()
      .single();

    if (participantError) throw participantError;

    const { data: responseData, error: responseError } = await serverSupabase
      .from('responses')
      .insert({
        campaign_id: response.campaign_id,
        participant_id: participantData.id,
        score: response.score,
        time_taken: response.time_taken,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Insert leaderboard entry and recompute ranks
    await serverSupabase.from('leaderboard').insert({
      campaign_id: response.campaign_id,
      participant_name: participant.full_name,
      participant_email: participant.email,
      participant_mobile: participant.mobile,
      score: response.score,
      total: response.total || 0,
      time_taken: response.time_taken,
      completed_at: new Date().toISOString(),
    });

    const { data: ordered } = await serverSupabase
      .from('leaderboard')
      .select('id, score, time_taken')
      .eq('campaign_id', response.campaign_id)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true });

    if (ordered && ordered.length) {
      for (let i = 0; i < ordered.length; i++) {
        const row: any = ordered[i];
        await serverSupabase.from('leaderboard').update({ rank: i + 1 }).eq('id', row.id);
      }
    }

    return res.status(200).json({ participant: participantData, response: responseData });
  } catch (err: any) {
    console.error('Server save-quiz-result error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
