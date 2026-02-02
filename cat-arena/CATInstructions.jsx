export default function CATInstructions({ onStart }) {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>CAT RC Sectional Instructions</h2>
      <ul>
        <li>4 passages, 16 questions</li>
        <li>Time: 30 minutes</li>
        <li>No negative marking</li>
        <li>Do not refresh during test</li>
      </ul>

      <button
        style={{ marginTop: 20, padding: "10px 20px" }}
        onClick={onStart}
      >
        I am ready to begin
      </button>
    </div>
  );
}
