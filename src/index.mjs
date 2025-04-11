import https from 'https';
import {URL} from 'url';

/**
 * Lambda Handler
 * @param {object} event - The event payload
 * @param {object} context - The AWS Lambda context
 * @returns {Promise<string>} - Response from Slack
 */
export const handler = async (event, context) => {
    console.log('FunctionHandler received:', JSON.stringify(event));

    let json;
    try {
        // event may be parsed already, or stringified (API Gateway case)
        json = typeof event === 'string' ? JSON.parse(event) : event;
    } catch (e) {
        console.error('Failed to parse input JSON:', e);
        return 'Invalid input';
    }

    console.log(`Body: ${json.body}`);
    const body = json.body;
    console.log(`Issue: ${body.issue}`);
    console.log(`Html: ${body.issue.html_url}`);
    const payload = JSON.stringify({
        text: `Issue Created: ${body.issue.html_url}`
    });

    const webhookUrl = process.env.SLACK_URL;
    if (!webhookUrl) {
        console.error('SLACK_URL is not defined in environment variables');
        return 'Slack URL not configured';
    }

    return sendToSlack(webhookUrl, payload);
};

function sendToSlack(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
      const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => resolve(responseData));
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });

        req.write(payload);
        req.end();
    });
}