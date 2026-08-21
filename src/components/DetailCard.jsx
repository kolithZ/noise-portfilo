export default function DetailCard({ card }) {
  return (
    <div className="w-full aspect-[16/10] rounded-[24px] relative overflow-hidden shadow-sm flex-shrink-0">
      <img
        src={card.image}
        alt="Card image"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
