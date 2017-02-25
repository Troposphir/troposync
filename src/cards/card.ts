export class Card {
    public title: string;
    public description: string;
    public action: string;
    public image: string;

    constructor({title, description, action, image}: {
        title: string,
        description: string,
        action: string,
        image: string
    }) {
        this.title = title;
        this.description = description;
        this.action = action;
        this.image = image;
    }
}