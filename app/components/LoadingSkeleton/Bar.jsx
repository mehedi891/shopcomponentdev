
const Bar = ({width='100%', height='15px', color='#dbdbdb', radius='7px'}) => {
  return (
    <div
      style={{
        width: width,
        height: height,
        backgroundColor: color,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: radius,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%)',
          animation: 'shine 2s infinite',
        }}
      />
    </div>
  )
}

export default Bar