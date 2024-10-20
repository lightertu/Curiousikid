import { Track } from 'livekit-client';
import * as React from 'react';
import {
  MediaDeviceMenu ,
  DisconnectButton ,
  TrackToggle,
  StartMediaButton,
  BarVisualizer,
  TrackReferenceOrPlaceholder,
  useLocalParticipant,
  useLocalParticipantPermissions,
  usePersistentUserChoices,
} from "@livekit/components-react";


type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

function mergeProps<T extends Props[]>(...args: T): UnionToIntersection<TupleTypes<T>> {
  // Start with a base clone of the first argument. This is a lot faster than starting
  // with an empty object and adding properties as we go.
  const result: Props = { ...args[0] };
  for (let i = 1; i < args.length; i++) {
    const props = args[i];
    for (const key in props) {
      const a = result[key];
      const b = props[key];

      // Chain events
      if (
          typeof a === 'function' &&
          typeof b === 'function' &&
          // This is a lot faster than a regex.
          key[0] === 'o' &&
          key[1] === 'n' &&
          key.charCodeAt(2) >= /* 'A' */ 65 &&
          key.charCodeAt(2) <= /* 'Z' */ 90
      ) {
        result[key] = chain(a, b);

        // Merge classnames, sometimes classNames are empty string which eval to false, so we just need to do a type check
      } else if (
          (key === 'className' || key === 'UNSAFE_className') &&
          typeof a === 'string' &&
          typeof b === 'string'
      ) {
        result[key] = clsx(a, b);
      } else {
        result[key] = b !== undefined ? b : a;
      }
    }
  }

  return result as UnionToIntersection<TupleTypes<T>>;
}

/** @beta */
export type CustomVoiceAssistantControlBarControls = {
  microphone?: boolean;
  leave?: boolean;
  onUnmute?: () => void;
  onMute?: () => void;
};

/** @beta */
export interface CustomVoiceAssistantControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  controls?: CustomVoiceAssistantControlBarControls;
  /**
   * If `true`, the user's device choices will be persisted.
   * This will enables the user to have the same device choices when they rejoin the room.
   * @defaultValue true
   */
  saveUserChoices?: boolean;
}

/**
 * @example
 * ```tsx
 * <LiveKitRoom ... >
 *   <VoiceAssistantControlBar />
 * </LiveKitRoom>
 * ```
 * @beta
 */
export function CustomVoiceAssistantControlBar({
  controls,
  saveUserChoices = true,
  onDeviceError,
  ...props
}: CustomVoiceAssistantControlBarProps) {
  const visibleControls = { leave: true, microphone: true, ...controls };
  const localPermissions = useLocalParticipantPermissions();
  const { microphoneTrack, localParticipant } = useLocalParticipant();

  const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);

  if (!localPermissions) {
    visibleControls.microphone = false;
  } else {
    visibleControls.microphone ??= localPermissions.canPublish;
  }

  const htmlProps = mergeProps({ className: 'lk-agent-control-bar' }, props);

  const { saveAudioInputEnabled, saveAudioInputDeviceId } = usePersistentUserChoices({
    preventSave: !saveUserChoices,
  });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) => {
      if (enabled) {
        controls?.onUnmute?.()
      } else {
        controls?.onMute?.()
      }
      if (isUserInitiated) {
        saveAudioInputEnabled(enabled);
      }
    },
    [saveAudioInputEnabled],
  );

  return (
    <div {...htmlProps}>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={true}
            onChange={microphoneOnChange}
            onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
          >
            <BarVisualizer trackRef={micTrackRef} barCount={7} options={{ minHeight: 5 }} />
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? '')}
            />
          </div>
        </div>
      )}

      {visibleControls.leave && <DisconnectButton>{'Disconnect'}</DisconnectButton>}
      <StartMediaButton />
    </div>
  );
}
