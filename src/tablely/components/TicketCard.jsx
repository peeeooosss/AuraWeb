export default function TicketCard({ children, dark = false, className = "", as: Tag = "div" }) {
  return (
    <Tag className={`ticket ${dark ? "ticket-dark" : ""} pt-6 pb-5 px-5 ${className}`}>
      {children}
    </Tag>
  );
}
