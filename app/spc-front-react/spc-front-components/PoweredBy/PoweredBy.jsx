
const PoweredBy = ({ shop }) => {
  const host = typeof window !== "undefined" ? window.location.host : "unknown-host";

  const href = `https://embedup.com/?utm_source=${encodeURIComponent(host)}&utm_medium=${encodeURIComponent(shop ?? "unknown-shop")}&utm_campaign=pby`;

  return (
    <div
      style={{
        fontSize: 12,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span>Powered by</span>
      <a
        style={{
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          color: "#0000ee",
        }}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        EmbedUp
      </a>
    </div>
  );
};

export default PoweredBy;
