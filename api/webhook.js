import axios from 'axios';

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'your_meta_access_token_here';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your_openai_api_key_here';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || 'your_phone_number_id_here';

/**
 * Handle GET requests for webhook verification
 * Meta WhatsApp sends a challenge to verify the webhook
 */
export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleWebhookVerification(req, res);
    } else if (req.method === 'POST') {
        return handleIncomingMessage(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

/**
 * GET Handler: Webhook Challenge Verification
 */
function handleWebhookVerification(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the token matches
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
    } else {
        console.error('❌ Webhook verification failed');
        return res.status(403).json({ error: 'Forbidden' });
    }
}

/**
 * POST Handler: Process incoming WhatsApp messages
 */
async function handleIncomingMessage(req, res) {
    const body = req.body;

    // Acknowledge receipt immediately
    res.status(200).json({ received: true });

    try {
        // Check if this is a message event
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];
            const from = message?.from;
            const messageText = message?.text?.body;

            if (!message || !from || !messageText) {
                console.log('No valid message found');
                return;
            }

            console.log(`📨 Message from ${from}: ${messageText}`);

            // Get AI response from OpenAI
            const aiResponse = await getOpenAIResponse(messageText);
            console.log(`🤖 AI Response: ${aiResponse}`);

            // Send response back to WhatsApp
            await sendWhatsAppMessage(from, aiResponse);
        }
    } catch (error) {
        console.error('Error processing message:', error.message);
    }
}

/**
 * Get response from OpenAI GPT-4o-mini
 */
async function getOpenAIResponse(userMessage) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant for THE SOUNDARYA, a premium ladies salon. 
                        You help customers with salon services, bookings, style recommendations, and general inquiries.
                        Keep responses concise and friendly. Suggest WhatsApp booking when appropriate.
                        Offer personalized style recommendations based on customer preferences.`
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        return "Sorry, I'm having trouble processing your request. Please try again or contact us directly!";
    }
}

/**
 * Send message back to WhatsApp
 */
async function sendWhatsAppMessage(recipientPhone, messageText) {
    try {
        const response = await axios.post(
            `https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipientPhone,
                type: 'text',
                text: {
                    body: messageText
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent to ${recipientPhone}:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Meta API Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * AI Recommendation API endpoint
 * Called by the frontend for style recommendations
 */
export async function aiRecommendation(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { faceShape, hairType, skinTone, occasion } = req.body;

    if (!faceShape || !hairType || !skinTone || !occasion) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const prompt = `As a professional hair and beauty stylist, provide personalized style recommendations for:
        - Face Shape: ${faceShape}
        - Hair Type: ${hairType}
        - Skin Tone: ${skinTone}
        - Occasion: ${occasion}
        
        Please provide:
        1. Best hairstyle recommendations (2-3 options)
        2. Makeup recommendations
        3. Color suggestions
        4. Styling tips
        
        Keep it concise but detailed.`;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert beauty and style consultant for THE SOUNDARYA salon.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const recommendations = response.data.choices[0].message.content.trim();
        return res.status(200).json({ recommendations });
    } catch (error) {
        console.error('AI Recommendation Error:', error.message);
        return res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message
        });
    }
}