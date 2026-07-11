function renderBoldText(line, lineIndex) {
  const parts = line.split(/(\*\*[^*]+?\*\*)/g);

  return parts.map((part, partIndex) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${lineIndex}-${partIndex}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function FormattedText({ text = "", className = "" }) {
  const lines = String(text ?? "").split("\n");

  return (
    <p className={`formatted-text ${className}`.trim()}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {renderBoldText(line, lineIndex)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

export default FormattedText;
