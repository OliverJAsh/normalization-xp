import * as deepMerge from "deepmerge";

namespace Photo {
    export type Denormalized = { id: string; user?: User.Denormalized };
    export type Normalized = { id: string; user?: string };
}

namespace User {
    export type Denormalized = { id: string; photos?: Photo.Denormalized[] };
    export type Normalized = { id: string; photos?: string[] };
}

type Dictionary<T> = { [key: string]: T };

type Entities = {
    photos: Dictionary<Photo.Normalized>;
    users: Dictionary<User.Normalized>;
};

type NormalizeOutput = { result: string; entities: Entities };

const normalizeUser = (denormalized: User.Denormalized): NormalizeOutput => {
    const id = denormalized.id;

    const photoOutputs = (() =>
        denormalized.photos
            ? denormalized.photos.map(normalizePhoto)
            : undefined)();

    const user: User.Normalized = {
        id,
        ...(photoOutputs !== undefined
            ? { photos: photoOutputs.map(photoOutput => photoOutput.result) }
            : {}),
    };

    const entities: Entities = {
        photos: {},
        users: { [id]: user },
    };

    const allEntities: Entities = deepMerge.all(
        [entities,
        ...(photoOutputs !== undefined
            ? photoOutputs.map(photoOutput => photoOutput.entities)
            : [{}]),
        ]
    ) as Entities;

    return { result: id, entities: allEntities };
};

const normalizePhoto = (denormalized: Photo.Denormalized): NormalizeOutput => {
    const id = denormalized.id;

    const userOutput = (() =>
        denormalized.user ? normalizeUser(denormalized.user) : undefined)();

    const photo: Photo.Normalized = {
        id,
        ...(userOutput !== undefined ? { user: userOutput.result } : {}),
    };

    const entities: Entities = {
        photos: { [id]: photo },
        users: {},
    };

    const allEntities: Entities = deepMerge(
        entities,
        userOutput !== undefined ? userOutput.entities : {},
    );

    return { result: id, entities: allEntities };
};

//
// Examples
//

console.log('Photo <- user')

{
    const denormalizedPhoto: Photo.Denormalized = {
        id: 'foo',
        user: {
            id: 'bar',
        },
    };
    const output = normalizePhoto(denormalizedPhoto);
    console.log(JSON.stringify(output, null, '\t'));
}

console.log('Photo')

{
    const denormalizedPhoto: Photo.Denormalized = {
        id: 'foo',
    };
    const output = normalizePhoto(denormalizedPhoto);
    console.log(JSON.stringify(output, null, '\t'));
}

console.log('User <- photo')

{
    const denormalizedPhoto: Photo.Denormalized = {
        id: 'foo',
    };
    const denormalizedUser: User.Denormalized = {
        id: 'bar',
        photos: [denormalizedPhoto],
    };
    const output = normalizeUser(denormalizedUser);
    console.log(JSON.stringify(output, null, '\t'));
}

console.log('User')

{
    const denormalizedUser: User.Denormalized = {
        id: 'foo',
    };
    const output = normalizeUser(denormalizedUser);
    console.log(JSON.stringify(output, null, '\t'));
}
