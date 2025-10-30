// Quick test of the checkout function
const SUPABASE_URL = 'https://siwzszmukfbzicjjkxro.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // You'll need to get this from your Supabase dashboard

async function testCheckout() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fake-token-for-testing`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        planName: 'Launch',
        billingCycle: 'monthly'
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCheckout();
