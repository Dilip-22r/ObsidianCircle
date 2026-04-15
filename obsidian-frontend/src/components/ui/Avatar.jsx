import defaultAvatar from "../../assets/avatars/default-avatar.png";

export default function Avatar({ src, size = 40 }) {
  return (
    <img
      src={src || defaultAvatar}
      alt="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
}
