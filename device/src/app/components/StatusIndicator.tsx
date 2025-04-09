export const StatusIndicator: React.FC<{ labelOn: string; labelOff: string; colorOn: string; colorOff: string; isOn: boolean }> = ({
    labelOn,
    labelOff,
    colorOn,
    colorOff,
    isOn,
}) => (
    <div className="flex items-center space-x-3 mb-4">
        <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: isOn ? colorOn : colorOff }}
        ></div>
        <span className="text-3xl text-black">{isOn ? labelOn : labelOff}</span>
    </div>
);