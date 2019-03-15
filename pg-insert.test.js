const expect = require('chai').expect;
const { Bulk, Column, Type } = require('./pg-insert');

const input = [{
    name: 'test',
    userId: 43,
    emailAddress: 'test@test.com',
}, {
    userId: 44,
    name: 'user test',
}];

const columns = [
    new Column('name', Type.String),
    new Column('emailAddress', Type.Varchar(10)),
    new Column('userId', Type.Integer, { required: true }),
];

describe('Create Bulk Insert DML Statement', () => {
    context('Invalid Input', () => {
        it('has no table columns provided', () => {
            const bulk = new Bulk('users', []);
            try { bulk.insert(input); } catch (e) { expect(e).to.be.an('error'); }
        });
    })
    context('Valid Input', () => {
        it('has valid input provided', () => {
            const columns = [
                new Column('name', Type.String),
                new Column('emailAddress', Type.Varchar(10)),
                new Column('userId', Type.Integer, { required: true }),
            ];
            const bulk = new Bulk('users', columns);
            const stmt = bulk.insert(input);
            expect(stmt).to.be.an('string');
            console.log('OUTPUT:::', stmt);
        });
    });
});
