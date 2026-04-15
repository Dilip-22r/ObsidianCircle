export default function Badge({ text }) {
  return (
    <span
      style={{
        padding: "4px 8px",
        background: "#444",
        color: "#fff",
        borderRadius: 4,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}
