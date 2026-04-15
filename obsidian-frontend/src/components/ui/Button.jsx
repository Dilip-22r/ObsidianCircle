export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
