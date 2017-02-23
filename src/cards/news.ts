export class NewsEntry {
    title: string;
    description: string;
    img_src: string;
    action: string;

    constructor(title: string, description: string, action: string = '', img_src: string = '') {
        this.title = title;
        this.description = description;
        this.img_src = img_src;
        this.action = action;
    }
}