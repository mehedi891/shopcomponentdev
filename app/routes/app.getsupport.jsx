import { useNavigate, useNavigation } from "react-router";
import LoadingSkeleton from "../components/LoadingSkeleton/LoadingSkeleton";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {

  const { admin } = await authenticate.admin(request);

//  const response = await admin.graphql(
//   `#graphql
//     mutation {
//       flowTriggerReceive(
//         handle: "embedup-trigger",
//         payload: {
//           email: "mehedi@efoli.com",
//           component: "min20"
//         }
//       ) {
//         userErrors {
//           field
//           message
//         }
//       }
//     }
//   `
// );


//   const data = await response.json();
//  console.log("Data::",data.data);

  return {
    success: true,
  };
}


const GetSupport = () => {
  const navgate = useNavigate();
  const navigation = useNavigation();

  const supportOptions = [
    {
      title: 'Live Chat Support',
      description: 'Need quick assistance? Chat live with our expert support team for instant solutions!',
      icon: 'chat-new',
      btnText: 'Chat with us',
      isOnclick: true,
      href: "#"
    },
    {
      title: 'Schedule a Call',
      description: 'Prefer a conversation? Schedule a call with our technical experts at a time that works for you!',
      icon: 'phone',
      btnText: 'Book a Call',
      isOnclick: false,
      href: "https://calendly.com/efolisupport/45min"
    },
    {
      title: 'Email Support',
      description: "Need detailed assistance? Reach out via email support@embedup.com, and we'll get back to you promptly.",
      icon: 'email',
      btnText: 'Email us',
      isOnclick: false,
      href: "mailto:support@embedup.com"
    },
    {
      title: 'YouTube Tutorials',
      description: "Discover our wide range of video tutorials created to assist you in managing discounts.",
      icon: 'video-list',
      btnText: 'Watch videos',
      isOnclick: false,
      href: "https://www.youtube.com/@EmbedUpApp"
    },
    {
      title: 'Help Docs',
      description: "Explore our in-depth help documentation for step-by-step guidance and solutions.",
      icon: 'note',
      btnText: 'Browse docs',
      isOnclick: false,
      href: "https://embedup.com/academy/"
    }
  ]

  return (navigation.state === "loading" ? <LoadingSkeleton /> :
    <s-page
      inlineSize="base"
    >
      <s-query-container>
        <s-stack
          padding="large-100 none none none"
          direction="inline"
          gap="small"
          justifyContent="start"
          alignItems="center"
        >
          <s-button onClick={() => navgate('/app')} accessibilityLabel="Back to analytics" icon="arrow-left" variant="tertiary"></s-button>
          <s-text type="strong">Get Support</s-text>
        </s-stack>
        <s-stack
          gap="small-300"
          paddingBlockEnd="base"
          paddingBlockStart="small"
        >
          <s-heading>Need assistance? We're here to help!</s-heading>
          <s-text>Whether you need a quick fix or detailed guidance, explore our range of support options to find what works best for you.</s-text>
        </s-stack>

        <s-grid
          gridTemplateColumns="repeat(auto-fill,minmax(300px,1fr))"
          gap="base"
          padding="large-100 none large-100 none"
        >

          {supportOptions.map((item, index) => (
            <s-grid-item key={index}>
              <s-stack
                justifyContent="space-between"
                gap="small"
                background="base"
                borderRadius="large"
                border="base"
                blockSize="215px"
              >
                <s-stack
                  direction="inline"
                  gap="small-300"
                  alignItems="center"
                  justifyContent="start"
                  background="strong"
                  padding="base small-200"
                  borderRadius="large large none none"
                >
                  <s-icon type={item.icon} />
                  <s-heading>{item.title}</s-heading>
                </s-stack>
                <s-stack
                  padding="none small base small"
                  justifyContent="space-between"
                  gap="large"
                >
                  <s-text>{item.description}</s-text>
                  {item.isOnclick ?
                    <s-button
                      onClick={() => { javascript: void (Tawk_API.toggle()) }}
                    >{item.btnText}</s-button>
                    :
                    <s-button
                      href={item.href}
                    >{item.btnText}</s-button>
                  }
                </s-stack>
              </s-stack>
            </s-grid-item>
          ))



          }


        </s-grid>
      </s-query-container>
    </s-page>
  )
}

export default GetSupport