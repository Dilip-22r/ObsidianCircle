export default function ProjectCard({ project }) {
  return (
    <div
      style={{
        border: "1px solid #333",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <h4>{project?.title || "Project Title"}</h4>
      <p>{project?.description || "Project description"}</p>
    </div>
  );
}
