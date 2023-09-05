import { Topic } from 'roslib';

type TopicConstructorOptions<T> = ConstructorParameters<typeof Topic<T>>[0];

export class ManagedTopic<T> {
    private publishers = new Set<string>();
    topic: Topic<T>;

    constructor(topicSettings: TopicConstructorOptions<T>) {
        this.topic = new Topic<T>(topicSettings);
    }

    addPublisher = (uuid: string) => {
        console.log(`Adding UUID ${uuid} to ${this.topic.settingsHash}`, {
            publishers: this.publishers,
            advertised: this.topic.isAdvertised,
        });
        this.publishers.add(uuid);
    };

    removePublisher = (uuid: string) => {
        console.log(`Removing UUID ${uuid} from ${this.topic.settingsHash}`, {
            publishers: this.publishers,
            advertised: this.topic.isAdvertised,
        });
        this.publishers.delete(uuid);
        if (this.publishers.size === 0 && this.topic.isAdvertised) {
            this.topic.unadvertise();
        }
    };

    canBeRemoved = () => {
        return (
            !this.topic.hasListeners() &&
            !this.topic.isAdvertised &&
            this.publishers.size == 0
        );
    };

    get numPublishers(): number {
        return this.publishers.size;
    }
}
