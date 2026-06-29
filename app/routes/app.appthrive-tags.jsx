import { useFetcher } from "react-router";

const WEBHOOK_URL = `https://app.appthrive.io/api/v1/tags`;
const APPTHRIVE_PAT = 'at_Oax4NuYU2p9rcreLlaTyNFgnQU0KTjfD';

// export const loader = async ({ request }) => {
//   const deleteUrl = `${WEBHOOK_URL}/tag_KuTYNX2o`
//   try {
//     const response = await fetch(deleteUrl, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${APPTHRIVE_PAT}`,
//       },
//       // body: JSON.stringify({
//       //   name: 'mailSent',
//       //   color: 'emerald',
//       //   description: ''
//       // }),
//     });
//     const responseText = await response.text();
//     let data;
//     try {
//       data = JSON.parse(responseText);
//       console.log("data:", data);
//     } catch {
//       data = responseText;
//       console.log("data C:", data);
//     }
//   } catch (error) {
//     console.log("Delete,Error",error);
//   }
//   return null;
// }

export const action = async ({ request }) => {
  const formData = await request.formData();
  const webhookUrl = formData.get('webhook') || WEBHOOK_URL;

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APPTHRIVE_PAT}`,
      },
      // body: JSON.stringify({
      //   name: 'mailSent',
      //   color: 'emerald',
      //   description: ''
      // }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("data:", data);
    } catch {
      data = responseText;
      console.log("data C:", data);
    }
  } catch (error) {
    console.log("Error:", error);
  }
};


const Tags = () => {
  const fetcher = useFetcher();
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetcher.submit(formData, { method: 'post' });
  };

  const result = fetcher.data ?? null;
  return (
    <s-page inlineSize="small">
      <s-query-container>
        <form method="post" onSubmit={handleFormSubmit}>
          <s-stack gap="base" padding="base" background="base" borderRadius="base">
            <s-text-field
              name="webhook"
              label="Webhook URL"
              placeholder="Enter your webhook URL here"
              value={WEBHOOK_URL}
              onChange={() => { }}
            />
            <s-button type="submit" variant="primary" loading={fetcher.state !== 'idle'}>
              Submit
            </s-button>
            {result && (
              <s-banner tone={result.success ? 'success' : 'critical'}>
                {result.message}
              </s-banner>
            )}
          </s-stack>
        </form>
      </s-query-container>
    </s-page>
  )
}

export default Tags