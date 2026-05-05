import { useActionData, useFetcher } from "react-router";
import crypto from "crypto";

const WEBHOOK_URL = 'https://app.appthrive.io/api/workflows/webhook/wh_uBTpKrjX7dL68hfMdB-715_E';
const HMAC_SECRET = 'uSE27d_MN-HEuCBuMy5H03jLaD6Ojd3NS-4_nlA0JmI';

export const action = async ({ request }) => {
  const formData = await request.formData();
  const webhookUrl = formData.get('webhook') || WEBHOOK_URL;

  const payload = { triggered_at: new Date().toISOString() };
  const body = JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(body)
    .digest('hex');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-appthrive-signature': `sha256=${signature}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Webhook response:', data);

    return { success: true, message: 'Workflow triggered successfully', data };
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return { success: false, message: error.message };
  }
};

const AppThrive = () => {
  const fetcher = useFetcher();
  const actionData = useActionData();
  console.log("actionData:",actionData);
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const inputValue = formData.get('webhook'); // Replace 'inputName' with the actual name attribute of your input
    fetcher.submit(formData, { method: 'post' });
      console.log('Form submitted with value:', inputValue);
  }
  return (
    <s-page inlineSize="small">
      <s-query-container>
        <form method="post" onSubmit={handleFormSubmit}>
          <s-stack gap="base" padding="base" background="base" borderRadius="base">
            <s-text-field
              name="webhook"
              label="Webhook URL"
              placeholder="Enter your webhook URL here"
              
              value="https://app.appthrive.io/api/workflows/webhook/wh_uBTpKrjX7dL68hfMdB-715_E"
            onChange={(e)=>{}}
            />
            <s-button type="submit" variant="primary">Submit</s-button>
          </s-stack>
            
        </form>
      </s-query-container>
    </s-page>
  )
}

export default AppThrive