export default function Card({ children }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #333",
        borderRadius: 6,
      }}
    >
      {children}
    </div>
  );
}
