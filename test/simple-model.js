var expect = require('chai').expect;
var _ = require('lodash');
var ziti = require('../index');
var hooks = require('./hooks');

var ModelInstance = require('../lib/model-instance');
var Animal = require('./models/animal');

describe('Simple Model', function () {

    before(hooks.sync);
    after(hooks.clean);

    var scope = { };

    describe('Model#save()', function() {
        it('should insert one Model data', function (done) {
            Animal.save({
                kind: 'bear',
                name: 'winnie',
                age: 5
            }).then(function (animal) {
                expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                var raw = animal.raw();
                expect(raw.kind).to.equals('bear');
                expect(raw.name).to.equals('winnie');
                expect(raw.age).to.equals(5);
                scope.animal = raw;
                done();
            }).catch(done);
        });

        it('should insert multiple Model data at once', function (done) {
            Animal.save([
                { kind: 'lion', name: 'simba' },
                { kind: 'lion', name: 'mufasa' },
                { kind: 'meerkat', name: 'timon' },
                { kind: 'warthog', name: 'pumba' },
                { kind: 'bird', name: 'zazu' },
                { kind: 'baboon', name: 'rafiki' },
                { kind: 'hyena', name: 'shenzi' },
                { kind: 'hyena', name: 'banzai' },
                { kind: 'hyena', name: 'ed' },
            ]).then(function (animals) {
                scope.animals = [ ];
                expect(animals).to.be.an('array').and.to.have.length(9);
                animals.forEach(function (animal) {
                    expect(animal).to.be.an.instanceof(ModelInstance);
                    var raw = animal.raw();
                    expect(raw).to.have.property('kind');
                    expect(raw).to.have.property('name');
                    expect(raw).to.have.property('age');
                    scope.animals.push(raw);
                });
                done();
            }).catch(done);
        });

        it('should successfully insert multiple Model data using a transaction', function (done) {
            Animal.save([
                { kind: 'Yellow Tang', name: 'Bubbles' },
                { kind: 'Starfish', name: 'Peach' },
                { kind: 'Octopus', name: 'Pearl' },
                { kind: 'Hippocampus', name: 'Sheldon' },
                { kind: 'Clownfish', name: 'Nemo' },
                { kind: 'Regal Blue Tang', name: 'Dory' },
                { kind: 'Shark', name: 'Bruce' },
            ], { multiple: true }).then(function (animals) {
                expect(animals).to.be.an('array').and.to.have.length(7);
                animals.forEach(function (animal) {
                    expect(animal).to.be.an.instanceof(ModelInstance);
                    var raw = animal.raw();
                    expect(raw).to.have.property('kind');
                    expect(raw).to.have.property('name');
                    expect(raw).to.have.property('age');
                });
                done();
            }).catch(done);
        });

        it('should fail to insert multiple Model data using a transaction and rollback', function (done) {
            Animal.save([
                { kind: 'Shrimp', name: 'Jacques' },
                { kind: 'Shark', name: 'Chum' },
                { kind: 'Clownfish', name: 'Nemo' },
                { kind: 'Regal Blue Tang', name: 'Dory' },
                { kind: 'Shark', name: 'Bruce' },
            ], { multiple: true }).then(function (animals) {
                done(new Error());
            }).catch(function (err) {
                done();
            });
        });

        it('should insert two Model data using the same connection', function (done) {
            ziti.withConnection(function (co) {
                Animal.save({ kind: 'rabbit', name: 'bugs bunny' }, { using: co })
                    .then(function (animal) {
                        expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                        var raw = animal.raw();
                        expect(raw.kind).to.equals('rabbit');
                        expect(raw.name).to.equals('bugs bunny');
                        expect(raw.age).to.equals(0);
                        return Animal.save({ kind: 'duck', name: 'daffy' }, { using: co });
                    }).then(function (animal) {
                        expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                        var raw = animal.raw();
                        expect(raw.kind).to.equals('duck');
                        expect(raw.name).to.equals('daffy');
                        expect(raw.age).to.equals(0);
                    }).finally(done);
            }).catch(done);
        });
    });

    describe('Model#remove()', function() {
        it('should remove multiple data', function (done) {
            Animal.remove({ kind: 'hyena' })
                .then(function (res) {
                    expect(res).to.have.property('affectedRows', 3);
                    done();
                }).catch(done);
        });
    });

    describe('Model#at()', function () {
        it('should find a piece of data using one of its unique field', function (done) {
            Animal.at({ name: scope.animal.name })
                .then(function (animal) {
                    expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                    expect(animal.get('name')).to.equals(scope.animal.name);
                    expect(animal.get('id')).to.equals(scope.animal.id);
                    done();
                }).catch(done);
        });

        it('should not find any data', function (done) {
            Animal.at({ name: 'alexandre' })
                .then(function (animal) {
                    expect(animal).to.be.a('null');
                    done();
                }).catch(done);
        });

        it('should find a piece of data using a unique field and a custom connection', function (done) {
            ziti.withConnection(function (co) {
                Animal.at({ name: scope.animal.name }, { using: co })
                    .then(function (animal) {
                        expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                        expect(animal.get('name')).to.equals(scope.animal.name);
                        expect(animal.get('id')).to.equals(scope.animal.id);
                    }).finally(done);
            }).catch(done);
        });

    });

    describe('Model#all()', function () {
        it('should find multiple data', function (done) {
            Animal.all({ $or: [ { kind: 'lion' }, { kind: 'shark' } ] })
                .then(function (animals) {
                    expect(animals).to.be.an('array').and.to.have.length(3);
                    animals.forEach(function (animal) {
                        expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                        var raw = animal.raw();
                        expect(raw).to.have.property('kind');
                        expect(raw).to.have.property('name');
                        expect(raw).to.have.property('age');

                    });
                    done();
                }).catch(done);
        });

        it('should find multiple data with a subset of attributes', function (done) {
            Animal.all({ $or: [ { kind: 'lion' }, { kind: 'shark' } ] },
                       { attributes: [ 'id', 'name' ] })
                .then(function (animals) {
                    expect(animals).to.be.an('array').and.to.have.length(3);
                    animals.forEach(function (animal) {
                        expect(animal).to.be.ok.and.to.be.an.instanceof(ModelInstance);
                        var raw = animal.raw();
                        expect(raw).to.not.have.property('kind');
                        expect(raw).to.have.property('name');
                        expect(raw).to.have.property('age');
                    });
                    done();
                }).catch(done);
        });

        it('should not find any data', function (done) {
            Animal.all({ kind: 'spider' })
                .then(function (animals) {
                    expect(animals).to.be.an('array').and.to.have.length(0);
                    done();
                }).catch(done);
        });
    });

});
