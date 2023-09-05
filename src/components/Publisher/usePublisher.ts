import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
    advertise,
    DefaultMessageType,
    getCachedTopic,
    TopicSettings,
    unadvertise,
} from '../../helpers/TopicHelpers';
import { useRos } from '../RosConnection';

export type PublisherHook<T> = {
    publish: (msg: T) => void;
};

export type PublisherMsgProp<TMessage extends object> = TMessage | (() => TMessage);

export interface PublisherProps extends TopicSettings {
    autoRepeat?: boolean;
}

function getMessage<TMessage extends object>(
    message: PublisherMsgProp<TMessage>,
): TMessage {
    if (typeof message === 'function') {
        return message();
    }
    return message;
}

export function usePublisher<TMessage extends object = DefaultMessageType>(
    props: PublisherProps,
    message?: PublisherMsgProp<TMessage>,
): PublisherHook<TMessage> {
    const hookId = useRef(uuidv4());
    const ros = useRos();

    const { autoRepeat, ...topicSettings } = props;

    const publisher = getCachedTopic<TMessage>(ros, topicSettings);

    useEffect(() => {
        let intervalId: number | undefined = undefined;
        let intervalStarted = false;

        if (!message) {
            console.log('Ending publish because message is unset');
            return;
        }
        console.log(`Starting publish effect`);

        if (autoRepeat) {
            const rate = topicSettings.throttleRate ?? 1;
            const period = Math.round(1000 / rate);
            intervalId = window.setInterval(() => {
                publisher.publish(getMessage(message));
                intervalStarted = true;
            }, period);
        } else {
            publisher.publish(getMessage(message));
        }

        return () => {
            clearInterval(intervalId);
            if (
                autoRepeat &&
                !intervalStarted &&
                message !== undefined &&
                publisher.isAdvertised
            ) {
                publisher.publish(getMessage(message));
            }
        };
    }, [autoRepeat, message, publisher, topicSettings.throttleRate]);

    useEffect(() => {
        const id = hookId.current;
        console.log(`Mounted publisher ${publisher.settingsHash} at hook ${id}`);
        advertise(publisher, id);
        return () => {
            console.log(`Unmounting publisher ${publisher.settingsHash} at hook ${id}`);
            unadvertise(publisher, id);
        };
    }, [publisher]);

    return {
        publish: msg => {
            publisher.publish(msg);
        },
    };
}
