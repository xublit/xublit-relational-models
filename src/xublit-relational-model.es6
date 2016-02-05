import * as ERR_MSG from './error-messages';

export var ref = 'XublitRelationalModel';
export var inject = ['XublitPersistenceModel'];
export function bootstrap (XublitPersistenceModel) {

    class XublitRelationalModel extends XublitPersistenceModel {

        constructor () {

            super();

            this.relationships = new Map();

            // var schemaRelationships = this.schema.relationships;
            // if (schemaRelationships) {

            //     schemaRelationships.forEach((rel, attrName) => {

            //         var LinkedModelLink = rel.isToMany
            //             ? LinkToManyModels
            //             : LinkToOneModel;

            //         var link = new LinkedModelLink(this, rel);

            //         this.links.set(attrName, link);

            //     });

            // }


        }

        /**
         * Set the value of an attribute
         *
         * @method     setAttr
         * @param      {String}  attrName  The name of the attribute
         * @param      {Array}   newValue  The new value
         * @return     {XublitRelationalModel}
         */
        setAttr (attrName, newValue) {

            if (undefined === newValue) {
                return this;
            }

            if (!this.isRelationshipAttr(attrName)) {
                return super.setAttr(attrName, newValue);
            }

            var relationship = this.getRelationship(attrName);
            if (!relationship.isToMany()) {
                return this.setRelationship(attrName, newValue);
            }

            if (!(newValue instanceof Array)) {
                newValue = [newValue];
            }

            newValue.forEach((refModelOrId) => {
                this.addRelationship(attrName, refModelOrId);
            });

            return this;

        }

        /**
         * Determine if an attribute is a relationship
         *
         * @method     isRelationshipAttr
         * @param      {String}   attrName  The name of the attribute
         * @return     {Boolean}  True if it's a relationship attribute
         */
        isRelationshipAttr (attrName) {
            return this.links.has(attrName);
        }

        /**
         * Get the object that describes the relationship for `attrName`
         *
         * @method     getRelationship
         * @param      {String}  attrName  The name of the attribute
         * @return     {XublitRelationalModelRelationship}  The object which
         *             describes the relationship
         */
        getRelationship (attrName) {

            if (!this.isRelationshipAttr(attrName)) {
                return undefined;
            }

            return this.relationships.get(attrName);

        }

        /**
         * Get the model(s) related to this model via `attrName`
         * 
         * ```js
         * var todosInMyList = myList.getRelated('todos');
         * ```
         *
         * @method     getRelated
         * @param      {String}  attrName  The name of the attribute which
         *             specifies the related model(s)
         * @return     {Array|XublitRelationalModel}  The related model(s)
         */
        getRelated (attrName) {

            if (!this.isRelationshipAttr(attrName)) {
                throw $e.newError(
                    ERR_MSG.INVALID_RELATIONSHIP_ATTR,
                    attrName
                );
            }

            var relationship = this.getRelationship(attrName);

            return relationship.isToMany() ?
                relationship.getRefModels() :
                relationship.getRefModel();

        }

        /**
         * Set the related model for a "to one" relationship type
         *
         * @method     setRelated
         * @param      {String}  attrName      The name of the relationship 
         *             attribute
         * @param      {XublitRelationalModel|String}  refModelOrId  The model
         *             or model ID of the model to link
         * @return     {XublitRelationalModel}
         */
        setRelated (attrName, refModelOrId) {

            var relationship = this.getRelationship(attrName);

            if (relationship.isToMany()) {
                throw $e.newError(
                    ERR_MSG.CANT_SET_TO_MANY
                );
            }

            relationship.setRef(refModelOrId);

            this.attrs[attrName] = relationship.value();
            this.changes.set[attrName] = relationship.value();
            this.numChanges++;

            return this;

        }

        /**
         * Add related models for a "to many" relationship type
         *
         * @method     addRelated
         * @param      {String}  attrName      The name of the relationship 
         *             attribute
         * @param      {XublitRelationalModel|String}  refModelOrId  The model
         *             or model ID of the model to link
         * @return     {XublitRelationalModel}
         */
        addRelated (attrName, refModelOrId) {

            var relationship = this.getRelationship(attrName);

            if (!relationship.isToMany()) {
                throw new Error(
                    ERR_MSG.CANT_ADD_TO_ONE
                );
            }

            var refModelId = relationship.addRef(refModelOrId);
            this.addValue(attrName, refModelId);

            return this;

        }

        /**
         * Ends the relationship between this model and the model identified by
         * `refModelOrId`.  Only effects the attribute identified by `attrName`.
         *
         * @method     removeRelationship
         * @param      {String}  attrName      The name of the relationship 
         *             attribute
         * @param      {XublitRelationalModel|String}  refModelOrId  The model
         *             or model ID of the model to unlink
         * @return     {XublitRelationalModel}
         */
        removeRelationship (attrName, refModelOrId) {
            this.getRelationship(attrName).removeRef(refModelOrId);
            return this;
        }

        asPersistableObject () {

            if (!this.isNew()) {
                throw new Error(
                    ERR_MSG.ONLY_NEW_MODELS_AVAILABLE_AS_PERSISTABLE
                );
            }

            return Object.assign(
                {},
                this.getAttrs(),
                this.getRelationshipAttrs()
            );

        }

        getRelationshipAttrs () {

            var relationshipAttrs = {};

            this.relationships.forEach((relationship, attrName) => {

                if (true === relationship.hasValue) {
                    relationshipAttrs[attrName] = relationship.value();
                }

            });

            return relationshipAttrs;

        }

        toJSON () {

            var relationshipAttrs = {};

            this.relationships.forEach((relationship, attrName) => {

                if (true === relationship.hasValue) {

                    relationshipAttrs[attrName] = relationship.isToMany() ?
                        relationship.getRefModels() :
                        relationship.getRefModel();

                    let relationshipValue = relationshipAttrs[attrName];

                    if (!relationshipValue || relationshipValue.length < 1) {
                        relationshipAttrs[attrName] = relationship.value();
                    }

                }

            });

            return _.extend(
                {id: this.id},
                this.defaultAttrs,
                this.getAttrs(),
                this.magicAttrs,
                relationshipAttrs
            );

        }

    }

    return XublitRelationalModel;

}